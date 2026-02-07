'use strict';

/**
 * @typedef {'critical'|'warn'|'info'} CvSeverity
 * @typedef {'ats'|'structure'|'impact'|'consistency'|'keywords'} CvCategory
 *
 * @typedef {Object} CvRule
 * @property {string} id
 * @property {CvSeverity} severity
 * @property {CvCategory} category
 * @property {number} scoreDelta
 * @property {(ctx: any) => boolean} check
 * @property {string} title
 * @property {string} message
 * @property {string} why
 * @property {string} fix
 *
 * @typedef {Object} CvIssue
 * @property {string} id
 * @property {CvSeverity} severity
 * @property {CvCategory} category
 * @property {number} scoreDelta
 * @property {string} title
 * @property {string} message
 * @property {string} explanation
 * @property {string} why
 * @property {string} fix
 * @property {{snippet:string,lineStart?:number,lineEnd?:number,reason?:string}[]} [evidence]
 */

module.exports = {};
