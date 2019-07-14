export const type = (something: any) => {
   return typeof something === 'object' ?
      (Array.isArray(something) ? 'array' : 'object') :
      typeof something;
};
