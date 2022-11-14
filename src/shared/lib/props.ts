/**
 * Represents all objects evolvable with Evolver E
 * @param E
 */
export type Evolvable<E extends Evolver> = {
    [P in keyof E]?: Evolved<E[P]>;
};

/**
 * <needs description>
 * @param O
 * @param E
 */
export type Evolve<O extends Evolvable<E>, E extends Evolver> = {
    [P in keyof O]: P extends keyof E ? EvolveValue<O[P], E[P]> : O[P];
};

/**
 * <needs description>
 * @param A
 */
type Evolved<A> = A extends (value: infer V) => any ? V : A extends Evolver ? Evolvable<A> : never;

/**
 * A set of transformation to run as part of an evolve
 * @param T - the type to be evolved
 */
export type Evolver<T extends Evolvable<any> = any> = {
    // if T[K] isn't evolvable, don't allow nesting for that property
    [key in keyof Partial<T>]: ((value: T[key]) => T[key]) | (T[key] extends Evolvable<any> ? Evolver<T[key]> : never);
};

/**
 * <needs description>
 * @param O
 * @param E
 */
type EvolveNestedValue<O, E extends Evolver> = O extends object
    ? O extends Evolvable<E>
        ? Evolve<O, E>
        : never
    : never;

/**
 * <needs description>
 * @param V
 * @param E
 */
type EvolveValue<V, E> = E extends (value: V) => any
    ? ReturnType<E>
    : E extends Evolver
    ? EvolveNestedValue<V, E>
    : never;

/**
 * Creates a new object by evolving a shallow copy of the `object`,
 * according to the functions in `transformations`.
 * All non-primitive properties are copied by reference.
 *
 * A function in `transformations` will not be invoked if its corresponding key does not exist in the evolved object.
 *
 * @example
 * ```typescript
 * const decrement = (n) => n - 1,
 * 	increment = (n) => n + 1,
 * 	trim = (string) => string.trim();
 *
 * const tomato = {
 * 	firstName: "  Tomato ",
 * 	data: { elapsed: 100, remaining: 1400 },
 * 	numbers: [1, 2, 3, 4]
 * 	id: 123
 * };
 *
 * const transformations = {
 * 	firstName: trim,
 * 	lastName: trim, // Will not get invoked for `tomato`.
 * 	data: { elapsed: increment, remaining: decrement }
 * 	numbers: (list) => list.map(increment)
 * };
 *
 * Props.evolve(transformations, tomato);
 * //=>{
 * //=>	firstName: 'Tomato',
 * //=>	data: { elapsed: 101, remaining: 1399 },
 * //=>	numbers: [2, 3, 4, 5],
 * //=>	id: 123
 * //=>}
 * ```
 */
const evolve = <E extends Evolver, V extends Evolvable<E>>(transformations: E, object: V): Evolve<V, E> => {
    if (!(typeof object === "object") && !Array.isArray(object)) {
        return object;
    } else {
        return Object.keys(object).reduce(
            (accumulator, key) =>
                Object.assign(accumulator, {
                    [key]:
                        typeof transformations[key] === "function"
                            ? (transformations[key] as (value: keyof V) => keyof V)(object[key]!)
                            : transformations[key] && typeof transformations[key] === "object"
                            ? evolve(transformations[key] as Evolver, object[key]!)
                            : object[key],
                }),

            object instanceof Array ? ([] as Evolve<V, E>) : ({} as Evolve<V, E>)
        );
    }
};

export const Props = {
    evolve,
};
