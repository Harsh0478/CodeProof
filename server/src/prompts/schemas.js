export const translationSchema = { type: 'object', properties: { code: { type: 'string' } }, required: ['code'], additionalProperties: false };
export const reviewSchema = {
  type: 'object', properties: {
    valid: { type: 'boolean' }, confidence: { type: 'number' },
    logicPreserved: { type: 'boolean' }, syntaxValid: { type: 'boolean' }, inputOutputEquivalent: { type: 'boolean' },
    issues: { type: 'array', items: { type: 'string' } }, suggestions: { type: 'array', items: { type: 'string' } }
  }, required: ['valid','confidence','logicPreserved','syntaxValid','inputOutputEquivalent','issues','suggestions'], additionalProperties: false
};
export const testsSchema = { type: 'object', properties: { tests: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, input: { type: 'string' } }, required: ['name','input'], additionalProperties: false } } }, required: ['tests'], additionalProperties: false };
