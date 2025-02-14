export function ensure<T>(param: T): asserts param is NonNullable<T> {
  if (param === undefined || param === null)
    throw new Error(
      "Param is undefined or null, but it should not be undefined or null.",
    )
}
