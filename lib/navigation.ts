export const sections = ['learn','questions','saved','interviews','prompts','voice','admin'] as const;
export function sectionFromHash(hash:string):string {const value=hash.replace(/^#/,'');return (sections as readonly string[]).includes(value)?value:'learn'}
