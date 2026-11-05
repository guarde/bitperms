/**
 * @todo(guarde): document ts
 */
export type Permission = bigint;

export interface PermissionSpecification {
  flags: readonly string[];
  roles?: Record<string, readonly string[]>;
}

/**
 * @todo(guarde): document ts too
 */
export interface PermissionKit<
  F extends readonly string[],
  R extends Record<string, readonly F[number][]> | undefined = undefined,
> {
  bits: Record<F[number], Permission>;
  roles: R extends Record<string, readonly F[number][]>
    ? Record<keyof R & string, Permission>
    : Record<string, never>;

  set(p: Permission, mask: Permission): Permission;
  clear(p: Permission, mask: Permission): Permission;
  toggle(p: Permission, mask: Permission): Permission;

  hasAll(p: Permission, mask: Permission): boolean;
  hasAny(p: Permission, mask: Permission): boolean;

  toNames(p: Permission): F[number][];
  fromNames(names: readonly F[number][]): Permission;
}

// @todo(guarde): is #create() a good function name?

/**
 * Create a permission kit
 * @param specification
 */
export function create<
  F extends readonly string[],
  R extends Record<string, readonly F[number][]> | undefined,
>(specification: { flags: F; roles?: R }): PermissionKit<F, R> {
  const bits = Object.create(null) as Record<F[number], Permission>;

  const flags = specification.flags as readonly F[number][];
  flags.forEach((name, idx) => {
    bits[name] = 1n << BigInt(idx);
  });

  const rolesOut: Record<string, Permission> = Object.create(null);

  if (specification.roles) {
    const roles = specification.roles as Record<string, readonly F[number][]>;
    for (const [roleName, names] of Object.entries(roles) as Array<
      [string, readonly F[number][]]
    >) {
      let mask = 0n;
      for (const n of names) mask |= bits[n];
      rolesOut[roleName] = mask;
    }
  }

  const set = (p: Permission, mask: Permission) => p | mask;
  const clear = (p: Permission, mask: Permission) => p & ~mask;
  const toggle = (p: Permission, mask: Permission) => p ^ mask;

  const hasAll = (p: Permission, mask: Permission) => (p & mask) === mask;
  const hasAny = (p: Permission, mask: Permission) => (p & mask) !== 0n;

  const toNames = (p: Permission) => flags.filter((n) => (p & bits[n]) !== 0n);

  const fromNames = (names: readonly F[number][]) => {
    let mask = 0n;
    for (const n of names) {
      const bit = (bits as Record<string, Permission>)[n];
      if (bit !== undefined) mask |= bit;
    }
    return mask;
  };

  return {
    bits,
    roles: rolesOut as PermissionKit<F, R>["roles"],
    set,
    clear,
    toggle,
    hasAll,
    hasAny,
    toNames,
    fromNames,
  };
}
