/**
 * The technologies with a debugging bank (cdn/questions/<tech>/debug.json). Pages that list every debugging task ask
 * only these, so no request goes to a bank that does not exist; lint-questions fails when the files and this list
 * differ. Scripts load this module too, so keep it free of Angular.
 */
export const DEBUG_BANK_TECHS = ['javascript', 'angular'] as const;
