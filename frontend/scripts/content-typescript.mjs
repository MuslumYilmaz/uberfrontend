import ts from 'typescript';

const sourceFiles = new Map();

/** Shared immutable AST reader for current files and historical source snapshots. */
export function parseTypeScript(source, fileName = 'content.ts') {
  const key = `${fileName}\0${source}`;
  if (!sourceFiles.has(key)) {
    sourceFiles.set(key, ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS));
  }
  return sourceFiles.get(key);
}

export function propertyNameToString(name) {
  if (!name) return '';
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return String(name.text || '');
  }
  return '';
}

export function getObjectProperty(objectLiteral, propName) {
  return objectLiteral.properties.find((prop) => {
    if (!ts.isPropertyAssignment(prop)) return false;
    return propertyNameToString(prop.name) === propName;
  }) || null;
}

export function readStringProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop) return '';
  const init = prop.initializer;
  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
    return init.text;
  }
  return '';
}

export function readObjectProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop || !ts.isObjectLiteralExpression(prop.initializer)) return null;
  return prop.initializer;
}

export function readStringArrayProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop || !ts.isArrayLiteralExpression(prop.initializer)) return [];
  return prop.initializer.elements
    .map((element) => {
      if (ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element)) {
        return element.text;
      }
      return '';
    })
    .filter(Boolean);
}

export function readImportPath(entryObject) {
  const loadProp = getObjectProperty(entryObject, 'load');
  if (!loadProp) return '';
  let importPath = '';
  function visit(node) {
    if (
      ts.isCallExpression(node)
      && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments.length > 0
      && ts.isStringLiteral(node.arguments[0])
    ) {
      importPath = node.arguments[0].text;
    }
    node.forEachChild(visit);
  }
  loadProp.initializer.forEachChild(visit);
  return importPath;
}

export function extractInlineComponentTemplate(sourceFile) {
  let template = '';
  sourceFile.forEachChild(function visit(node) {
    if (
      ts.isDecorator(node)
      && ts.isCallExpression(node.expression)
      && ts.isIdentifier(node.expression.expression)
      && node.expression.expression.text === 'Component'
    ) {
      const [arg] = node.expression.arguments;
      if (!arg || !ts.isObjectLiteralExpression(arg)) return;
      const templateProp = getObjectProperty(arg, 'template');
      if (!templateProp) return;
      const init = templateProp.initializer;
      if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
        template = init.text;
      } else {
        template = init.getText(sourceFile);
      }
    }
    node.forEachChild(visit);
  });

  return template;
}
