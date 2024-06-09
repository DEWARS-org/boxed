import { expect } from "@std/expect"
import {fail} from "@std/assert"
import { match, P } from "ts-pattern";

import { Option, Result } from "../src/OptionResult.ts";

Deno.test("Result.is{Ok|Error}", () => {
  expect(Result.Ok(1).isOk()).toBeTruthy();
  expect(Result.Ok(1).isError()).toBeFalsy();

  expect(Result.Error(1).isOk()).toBeFalsy();
  expect(Result.Error(1).isError()).toBeTruthy();
});

Deno.test("Result.map", () => {
  expect(Result.Ok(1).map((x) => x * 2)).toEqual(Result.Ok(2));
  expect(Result.Error<number, number>(1).map((x) => x * 2)).toEqual(
    Result.Error(1),
  );
});

Deno.test("Result.mapError", () => {
  expect(Result.Ok<number, number>(1).mapError((x) => x * 2)).toEqual(
    Result.Ok(1),
  );
  expect(Result.Error<number, number>(1).mapError((x) => x * 2)).toEqual(
    Result.Error(2),
  );
});

type A = 1;
type B = 2;

Deno.test("Result.flatMap", () => {
  expect(Result.Ok(1).flatMap((x) => Result.Ok(x * 2))).toEqual(Result.Ok(2));
  expect(
    Result.Error<number, number>(1).flatMap((x) => Result.Ok(x * 2)),
  ).toEqual(Result.Error(1));
  expect(Result.Ok(1).flatMap((x) => Result.Error(1))).toEqual(Result.Error(1));
  const resultA: Result<number, A> = Result.Ok(1);
  const resultB: Result<number, B> = Result.Error(2);
  const resultC = resultA.flatMap((item) => {
    return resultB;
  });
  expect(resultC).toEqual(Result.Error(2));
});

Deno.test("Result.flatMapError", () => {
  expect(
    Result.Ok<number, number>(1).flatMapError((x) => Result.Ok(x * 2)),
  ).toEqual(Result.Ok(1));
  expect(
    Result.Error<number, number>(1).flatMapError((x) => Result.Ok(x * 2)),
  ).toEqual(Result.Ok(2));
  expect(Result.Error(1).flatMapError((x) => Result.Error(2))).toEqual(
    Result.Error(2),
  );
  const resultA: Result<A, number> = Result.Error(1);
  const resultB: Result<B, number> = Result.Error(2);
  const resultC = resultA.flatMapError((item) => {
    return resultB;
  });
  expect(resultC).toEqual(Result.Error(2));
});

Deno.test("Result.getWithDefault", () => {
  expect(Result.Ok(1).getWithDefault(0)).toEqual(1);
  expect(Result.Error<number, number>(1).getWithDefault(0)).toEqual(0);
});

Deno.test("Result.getOr", () => {
  expect(Result.Ok(1).getOr(0)).toEqual(1);
  expect(Result.Error<number, number>(1).getOr(0)).toEqual(0);
});

Deno.test("Result.match", () => {
  Result.Error<number, number>(1).match({
    Error: (value) => expect(value).toBe(1),
    Ok: () => expect(true).toBe(false),
  });
  Result.Ok(1).match({
    Error: () => expect(true).toBe(false),
    Ok: (value) => expect(value).toBe(1),
  });
});

Deno.test("Result.toOption", () => {
  expect(Result.Ok(1).toOption()).toEqual(Option.Some(1));
  expect(Result.Error(1).toOption()).toEqual(Option.None());
});

Deno.test("Result.fromExecution", () => {
  expect(Result.fromExecution(() => 1)).toEqual(Result.Ok(1));
  expect(
    Result.fromExecution(() => {
      throw "foo";
    }),
  ).toEqual(Result.Error("foo"));
  expect(
    Result.fromExecution(() => {
      throw 1;
    }),
  ).toEqual(Result.Error(1));
});

Deno.test("Result.fromPromise", async () => {
  await expect(await Result.fromPromise(Promise.resolve(1))).toEqual(
    Result.Ok(1),
  );
  await expect(await Result.fromPromise(Promise.reject(1))).toEqual(
    Result.Error(1),
  );
  await expect(
    await Result.fromPromise(
      Promise.all([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]),
    ),
  ).toEqual(Result.Ok([1, 2, 3]));
  await expect(
    await Result.fromPromise(
      Promise.all([Promise.resolve(1), Promise.reject(2), Promise.resolve(3)]),
    ),
  ).toEqual(Result.Error(2));
});

Deno.test("Result.equals", () => {
  expect(
    Result.equals(Result.Error(1), Result.Error(2), (a, b) => a === b),
  ).toBe(true);
  expect(Result.equals(Result.Error(1), Result.Ok(1), (a, b) => a === b)).toBe(
    false,
  );
  expect(Result.equals(Result.Ok(1), Result.Ok(1), (a, b) => a === b)).toBe(
    true,
  );
  expect(Result.equals(Result.Ok(1), Result.Ok(2), (a, b) => a === b)).toBe(
    false,
  );
  expect(
    Result.equals(Result.Ok(1), Result.Ok(2), (a, b) => Math.abs(a - b) < 2),
  ).toBe(true);
  expect(
    Result.equals(Result.Ok(1), Result.Ok(6), (a, b) => Math.abs(a - b) < 2),
  ).toBe(false);
});

Deno.test("Result serialize", () => {
  expect(JSON.parse(JSON.stringify(Result.Error(1)))).toEqual({
    tag: "Error",
    error: 1,
  });
  expect(JSON.parse(JSON.stringify(Result.Ok(1)))).toEqual({
    tag: "Ok",
    value: 1,
  });
});

Deno.test("Result.tap", () => {
  expect(
    Result.Ok(1).tap((value) => expect(value).toEqual(Result.Ok(1))),
  ).toEqual(Result.Ok(1));
  expect(
    Result.Error(1).tap((value) => expect(value).toEqual(Result.Error(1))),
  ).toEqual(Result.Error(1));
});

Deno.test("Result.tapOk", () => {
  expect(Result.Ok(1).tapOk((value) => expect(value).toEqual(1))).toEqual(
    Result.Ok(1),
  );
  expect(Result.Error(1).tapOk(() => fail())).toEqual(Result.Error(1));
});

Deno.test("Result.tapError", () => {
  expect(Result.Ok(1).tapError((value) => fail())).toEqual(Result.Ok(1));
  expect(Result.Error(1).tapError((value) => expect(value).toEqual(1))).toEqual(
    Result.Error(1),
  );
});

Deno.test("Result.all", () => {
  expect(Result.all([])).toEqual(Result.Ok([]));
  expect(Result.all([Result.Ok(1), Result.Ok(2), Result.Ok(3)])).toEqual(
    Result.Ok([1, 2, 3]),
  );
  expect(Result.all([Result.Error(1), Result.Ok(2), Result.Ok(3)])).toEqual(
    Result.Error(1),
  );
  expect(Result.all([Result.Ok(1), Result.Error(2), Result.Ok(3)])).toEqual(
    Result.Error(2),
  );
});

Deno.test("Result.allFromDict", () => {
  expect(Result.allFromDict({})).toEqual(Result.Ok({}));
  expect(
    Result.allFromDict({ a: Result.Ok(1), b: Result.Ok(2), c: Result.Ok(3) }),
  ).toEqual(Result.Ok({ a: 1, b: 2, c: 3 }));
  expect(
    Result.allFromDict({
      a: Result.Error(1),
      b: Result.Ok(2),
      c: Result.Ok(3),
    }),
  ).toEqual(Result.Error(1));
  expect(
    Result.allFromDict({
      a: Result.Ok(1),
      b: Result.Error(2),
      c: Result.Ok(3),
    }),
  ).toEqual(Result.Error(2));
});

Deno.test("ts-pattern", () => {
  expect(
    match(Result.Ok(1))
      .with(Result.P.Ok(P.select()), (value) => value)
      .with(Result.P.Error(P.any), () => 2)
      .exhaustive(),
  ).toEqual(1);

  expect(
    match(Result.Error(2))
      .with(Result.P.Ok(P.any), (value) => value)
      .with(Result.P.Error(P.select()), (value) => value)
      .exhaustive(),
  ).toEqual(2);
});

Deno.test("Result.get", () => {
  const result: Result<number, unknown> = Result.Ok(1);
  if (result.isOk()) {
    expect(result.get()).toEqual(1);
  }
});

Deno.test("Result.getError", () => {
  const result: Result<unknown, number> = Result.Error(1);
  if (result.isError()) {
    expect(result.getError()).toEqual(1);
  }
});

Deno.test("Result.fromOption", () => {
  expect(Result.fromOption(Option.Some(1), "NotFound")).toEqual(Result.Ok(1));
  expect(Result.fromOption(Option.None(), "NotFound")).toEqual(
    Result.Error("NotFound"),
  );
});

Deno.test("Result.isResult", async () => {
  expect(Result.isResult(Result.Ok(1))).toEqual(true);
  expect(Result.isResult(Result.Error(1))).toEqual(true);
  expect(Result.isResult(1)).toEqual(false);
  expect(Result.isResult([])).toEqual(false);
  expect(Result.isResult({})).toEqual(false);
});
