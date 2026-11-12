/**
 * The JIT half of Angular's signal APIs for the preview, which compiles each file with `ts.transpileModule`. A field of
 * a component or directive set from `input()`, `model()`, `output()`, `outputFromObservable()` or a signal query gets
 * the decorator the Angular CLI's JIT transform gives it (compiler-cli, transform/jit/initializer_api_transforms), so
 * the runtime JIT compiler sees the binding. Without it the field stays a plain property and its binding is ignored.
 *
 * Without a type checker the APIs are recognised by their import from @angular/core (aliases included). The function
 * is self-contained on purpose: the preview builder embeds its source in the preview document, where `ts` is the
 * TypeScript bundle loaded there.
 */
export function faSignalJitTransformer(ts: any): (context: any) => (sourceFile: any) => any {
  var CORE = '@angular/core';
  var INTEROP = '@angular/core/rxjs-interop';
  var NAMESPACE = '__faNgCore';
  var CORE_APIS = ['input', 'model', 'output', 'viewChild', 'viewChildren', 'contentChild', 'contentChildren'];
  var REQUIRED_APIS = ['input', 'model', 'viewChild', 'contentChild'];
  var QUERY_DECORATORS: Record<string, string> = {
    viewChild: 'ViewChild',
    viewChildren: 'ViewChildren',
    contentChild: 'ContentChild',
    contentChildren: 'ContentChildren',
  };

  function decoratorsOf(node: any): any[] {
    return (ts.getDecorators ? ts.getDecorators(node) : node.decorators) || [];
  }

  function decoratorName(decorator: any): string | null {
    var expression = decorator.expression;
    if (!ts.isCallExpression(expression)) return null;
    var callee = expression.expression;
    if (ts.isIdentifier(callee)) return callee.text;
    if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
    return null;
  }

  return function (context: any) {
    var factory = context.factory;
    return function (sourceFile: any) {
      // Local name -> API name, for the signal APIs this file imports.
      var apis: Record<string, string> = {};
      var found = false;
      sourceFile.statements.forEach(function (statement: any) {
        if (!ts.isImportDeclaration(statement) || !statement.importClause) return;
        var from = statement.moduleSpecifier && statement.moduleSpecifier.text;
        var bindings = statement.importClause.namedBindings;
        if ((from !== CORE && from !== INTEROP) || !bindings || !ts.isNamedImports(bindings)) return;
        bindings.elements.forEach(function (element: any) {
          var imported = (element.propertyName || element.name).text;
          var known = from === INTEROP ? imported === 'outputFromObservable' : CORE_APIS.indexOf(imported) !== -1;
          if (known) {
            apis[element.name.text] = imported;
            found = true;
          }
        });
      });
      if (!found) return sourceFile;

      var changed = false;

      function ngDecorator(name: string, args: any[]): any {
        var target = factory.createPropertyAccessExpression(factory.createIdentifier(NAMESPACE), name);
        return factory.createDecorator(factory.createCallExpression(target, undefined, args));
      }

      function objectArgument(call: any, index: number): any {
        var argument = call.arguments[index];
        return argument && ts.isObjectLiteralExpression(argument) ? argument : null;
      }

      function aliasFrom(options: any, fallback: string): string {
        if (!options) return fallback;
        for (var i = 0; i < options.properties.length; i++) {
          var property = options.properties[i];
          if (ts.isPropertyAssignment(property) && property.name && property.name.text === 'alias'
            && ts.isStringLiteralLike(property.initializer)) {
            return property.initializer.text;
          }
        }
        return fallback;
      }

      // input(...), input.required(...) and their peers, called by the name this file imports them under.
      function readInitializer(initializer: any): { api: string; required: boolean; call: any } | null {
        if (!initializer || !ts.isCallExpression(initializer)) return null;
        var callee = initializer.expression;
        var local: string;
        var required = false;
        if (ts.isIdentifier(callee)) {
          local = callee.text;
        } else if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.name.text === 'required') {
          local = callee.expression.text;
          required = true;
        } else {
          return null;
        }
        var api = Object.prototype.hasOwnProperty.call(apis, local) ? apis[local] : null;
        if (!api || (required && REQUIRED_APIS.indexOf(api) === -1)) return null;
        return { api: api, required: required, call: initializer };
      }

      function decoratorsFor(member: any): any[] | null {
        var read = readInitializer(member.initializer);
        if (!read || !member.name || !(ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))) return null;
        var field = member.name.text;
        var call = read.call;
        if (read.api === 'input' || read.api === 'model') {
          var alias = aliasFrom(objectArgument(call, read.required ? 0 : 1), field);
          var config = [
            factory.createPropertyAssignment('isSignal', factory.createTrue()),
            factory.createPropertyAssignment('alias', factory.createStringLiteral(alias)),
            factory.createPropertyAssignment('required', read.required ? factory.createTrue() : factory.createFalse()),
          ];
          // The input signal runs its own transform, so the decorator names none (as the CLI's transform does).
          if (read.api === 'input') config.push(factory.createPropertyAssignment('transform', factory.createIdentifier('undefined')));
          var list = [ngDecorator('Input', [factory.createObjectLiteralExpression(config)])];
          if (read.api === 'model') list.push(ngDecorator('Output', [factory.createStringLiteral(alias + 'Change')]));
          return list;
        }
        if (read.api === 'output' || read.api === 'outputFromObservable') {
          var options = objectArgument(call, read.api === 'output' ? 0 : 1);
          return [ngDecorator('Output', [factory.createStringLiteral(aliasFrom(options, field))])];
        }
        // A query keeps its predicate and options, flagged as a signal query.
        if (!call.arguments.length) return null;
        var properties: any[] = [];
        if (call.arguments.length > 1) properties.push(factory.createSpreadAssignment(call.arguments[1]));
        properties.push(factory.createPropertyAssignment('isSignal', factory.createTrue()));
        return [ngDecorator(QUERY_DECORATORS[read.api], [call.arguments[0], factory.createObjectLiteralExpression(properties)])];
      }

      function isComponentOrDirective(node: any): boolean {
        return decoratorsOf(node).some(function (decorator: any) {
          var name = decoratorName(decorator);
          return name === 'Component' || name === 'Directive';
        });
      }

      function visit(node: any): any {
        if (ts.isClassDeclaration(node) && isComponentOrDirective(node)) {
          var classChanged = false;
          var members = node.members.map(function (member: any) {
            // A field that already carries a decorator keeps it, as in the CLI.
            if (!ts.isPropertyDeclaration(member) || decoratorsOf(member).length) return member;
            var decorators = decoratorsFor(member);
            if (!decorators) return member;
            classChanged = true;
            return factory.updatePropertyDeclaration(
              member,
              decorators.concat(member.modifiers || []),
              member.name,
              member.questionToken || member.exclamationToken,
              member.type,
              member.initializer,
            );
          });
          if (!classChanged) return node;
          changed = true;
          return factory.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, members);
        }
        return ts.visitEachChild(node, visit, context);
      }

      var result = ts.visitNode(sourceFile, visit);
      if (!changed) return result;
      var namespaceImport = factory.createImportDeclaration(
        undefined,
        factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier(NAMESPACE))),
        factory.createStringLiteral(CORE),
      );
      return factory.updateSourceFile(result, [namespaceImport].concat(result.statements));
    };
  };
}
