import { expect } from "@std/expect";
import { match, P } from "@dewars/pattern";

import { AsyncData } from "../src/AsyncData.ts";
import { Option, Result } from "../src/OptionResult.ts";

Deno.test("AsyncData.is{Done|Loading|NotAsked}", () => {
  expect(AsyncData.Done(1).isDone()).toBeTruthy();
  expect(AsyncData.Done(1).isLoading()).toBeFalsy();
  expect(AsyncData.Done(1).isNotAsked()).toBeFalsy();

  expect(AsyncData.Loading().isDone()).toBeFalsy();
  expect(AsyncData.Loading().isLoading()).toBeTruthy();
  expect(AsyncData.Loading().isNotAsked()).toBeFalsy();

  expect(AsyncData.NotAsked().isDone()).toBeFalsy();
  expect(AsyncData.NotAsked().isLoading()).toBeFalsy();
  expect(AsyncData.NotAsked().isNotAsked()).toBeTruthy();
});

Deno.test("AsyncData.map", () => {
  expect(AsyncData.NotAsked<number>().map((x) => x * 2)).toEqual(
    AsyncData.NotAsked(),
  );
  expect(AsyncData.Loading<number>().map((x) => x * 2)).toEqual(
    AsyncData.Loading(),
  );
  expect(AsyncData.Done(5).map((x) => x * 2)).toEqual(AsyncData.Done(10));
});

Deno.test("AsyncData.flatMap", () => {
  expect(
    AsyncData.NotAsked<number>().flatMap((x) => AsyncData.Done(x * 2)),
  ).toEqual(AsyncData.NotAsked());
  expect(
    AsyncData.Loading<number>().flatMap((x) => AsyncData.Done(x * 2)),
  ).toEqual(AsyncData.Loading());
  expect(AsyncData.Done(5).flatMap((x) => AsyncData.Done(x * 2))).toEqual(
    AsyncData.Done(10),
  );
  expect(AsyncData.Done(5).flatMap((x) => AsyncData.NotAsked())).toEqual(
    AsyncData.NotAsked(),
  );
  expect(AsyncData.Done(5).flatMap((x) => AsyncData.Loading())).toEqual(
    AsyncData.Loading(),
  );
});

Deno.test("AsyncData.getWithDefault", () => {
  expect(AsyncData.NotAsked<number>().getWithDefault(0)).toEqual(0);
  expect(AsyncData.Loading<number>().getWithDefault(0)).toEqual(0);
  expect(AsyncData.Done(5).getWithDefault(0)).toEqual(5);
});

Deno.test("AsyncData.getOr", () => {
  expect(AsyncData.NotAsked<number>().getOr(0)).toEqual(0);
  expect(AsyncData.Loading<number>().getOr(0)).toEqual(0);
  expect(AsyncData.Done(5).getOr(0)).toEqual(5);
});

Deno.test("AsyncData.toOption", () => {
  expect(AsyncData.NotAsked<number>().toOption()).toEqual(Option.None());
  expect(AsyncData.Loading<number>().toOption()).toEqual(Option.None());
  expect(AsyncData.Done(5).toOption()).toEqual(Option.Some(5));
});

Deno.test("AsyncData.match", () => {
  AsyncData.NotAsked<number>().match({
    NotAsked: () => expect(true).toBe(true),
    Loading: () => expect(true).toBe(false),
    Done: () => expect(true).toBe(false),
  });
  AsyncData.Loading<number>().match({
    NotAsked: () => expect(true).toBe(false),
    Loading: () => expect(true).toBe(true),
    Done: () => expect(true).toBe(false),
  });
  AsyncData.Done(5).match({
    NotAsked: () => expect(true).toBe(false),
    Loading: () => expect(true).toBe(true),
    Done: (value) => expect(value).toBe(5),
  });
});

Deno.test("AsyncData.equals", () => {
  expect(
    AsyncData.equals(
      AsyncData.NotAsked(),
      AsyncData.NotAsked(),
      (a, b) => a === b,
    ),
  ).toBe(true);
  expect(
    AsyncData.equals(
      AsyncData.NotAsked(),
      AsyncData.Loading(),
      (a, b) => a === b,
    ),
  ).toBe(false);
  expect(
    AsyncData.equals(AsyncData.Done(1), AsyncData.Loading(), (a, b) => a === b),
  ).toBe(false);
  expect(
    AsyncData.equals(
      AsyncData.Done(1),
      AsyncData.NotAsked(),
      (a, b) => a === b,
    ),
  ).toBe(false);
  expect(
    AsyncData.equals(
      AsyncData.Loading(),
      AsyncData.Loading(),
      (a, b) => a === b,
    ),
  ).toBe(true);
  expect(
    AsyncData.equals(AsyncData.Done(1), AsyncData.Done(1), (a, b) => a === b),
  ).toBe(true);
  expect(
    AsyncData.equals(AsyncData.Done(1), AsyncData.Done(2), (a, b) => a === b),
  ).toBe(false);
  expect(
    AsyncData.equals(
      AsyncData.Done(1),
      AsyncData.Done(2),
      (a, b) => Math.abs(a - b) < 2,
    ),
  ).toBe(true);
  expect(
    AsyncData.equals(
      AsyncData.Done(1),
      AsyncData.Done(6),
      (a, b) => Math.abs(a - b) < 2,
    ),
  ).toBe(false);
});

Deno.test("AsyncData serialize", () => {
  expect(JSON.parse(JSON.stringify(AsyncData.NotAsked()))).toEqual({
    tag: "NotAsked",
  });
  expect(JSON.parse(JSON.stringify(AsyncData.Loading()))).toEqual({
    tag: "Loading",
  });
  expect(JSON.parse(JSON.stringify(AsyncData.Done(1)))).toEqual({
    tag: "Done",
    value: 1,
  });
});

Deno.test("AsyncData.tap", () => {
  expect(
    AsyncData.NotAsked().tap((value) =>
      expect(value).toEqual(AsyncData.NotAsked())
    ),
  ).toEqual(AsyncData.NotAsked());
  expect(
    AsyncData.Loading().tap((value) =>
      expect(value).toEqual(AsyncData.Loading())
    ),
  ).toEqual(AsyncData.Loading());
  expect(
    AsyncData.Done(1).tap((value) => expect(value).toEqual(AsyncData.Done(1))),
  ).toEqual(AsyncData.Done(1));
});

Deno.test("AsyncData.all", () => {
  expect(AsyncData.all([])).toEqual(AsyncData.Done([]));
  expect(
    AsyncData.all([AsyncData.Done(1), AsyncData.Done(2), AsyncData.Done(3)]),
  ).toEqual(AsyncData.Done([1, 2, 3]));
  expect(
    AsyncData.all([AsyncData.NotAsked(), AsyncData.Done(2), AsyncData.Done(3)]),
  ).toEqual(AsyncData.NotAsked());
  expect(
    AsyncData.all([AsyncData.Done(1), AsyncData.Loading(), AsyncData.Done(3)]),
  ).toEqual(AsyncData.Loading());
  expect(
    AsyncData.all([
      AsyncData.Loading(),
      AsyncData.NotAsked(),
      AsyncData.Done(3),
    ]),
  ).toEqual(AsyncData.Loading());
  expect(
    AsyncData.all([
      AsyncData.NotAsked(),
      AsyncData.Loading(),
      AsyncData.Done(3),
    ]),
  ).toEqual(AsyncData.NotAsked());
});

Deno.test("AsyncData.allFromDict", () => {
  expect(AsyncData.allFromDict({})).toEqual(AsyncData.Done({}));
  expect(
    AsyncData.allFromDict({
      a: AsyncData.Done(1),
      b: AsyncData.Done(2),
      c: AsyncData.Done(3),
    }),
  ).toEqual(AsyncData.Done({ a: 1, b: 2, c: 3 }));
  expect(
    AsyncData.allFromDict({
      a: AsyncData.NotAsked(),
      b: AsyncData.Done(2),
      c: AsyncData.Done(3),
    }),
  ).toEqual(AsyncData.NotAsked());
  expect(
    AsyncData.allFromDict({
      a: AsyncData.Done(1),
      b: AsyncData.Loading(),
      c: AsyncData.Done(3),
    }),
  ).toEqual(AsyncData.Loading());
  expect(
    AsyncData.allFromDict({
      a: AsyncData.Loading(),
      b: AsyncData.NotAsked(),
      c: AsyncData.Done(3),
    }),
  ).toEqual(AsyncData.Loading());
  expect(
    AsyncData.allFromDict({
      a: AsyncData.NotAsked(),
      b: AsyncData.Loading(),
      c: AsyncData.Done(3),
    }),
  ).toEqual(AsyncData.NotAsked());
});

Deno.test("@dewars/pattern", () => {
  expect(
    match(AsyncData.Done(1))
      .with(AsyncData.P.Done(P.select()), (value) => value)
      .with(AsyncData.P.Loading, () => 2)
      .with(AsyncData.P.NotAsked, () => 3)
      .exhaustive(),
  ).toEqual(1);
  expect(
    match(AsyncData.Loading())
      .with(AsyncData.P.Done(P.any), (value) => value)
      .with(AsyncData.P.Loading, () => 2)
      .with(AsyncData.P.NotAsked, () => 3)
      .exhaustive(),
  ).toEqual(2);
  expect(
    match(AsyncData.NotAsked())
      .with(AsyncData.P.Done(P.any), (value) => value)
      .with(AsyncData.P.Loading, () => 2)
      .with(AsyncData.P.NotAsked, () => 3)
      .exhaustive(),
  ).toEqual(3);
});

Deno.test("Option.get", () => {
  const asyncData: AsyncData<number> = AsyncData.Done(1);
  if (asyncData.isDone()) {
    expect(asyncData.get()).toEqual(1);
  }
});

Deno.test("AsyncData mapOk", async () => {
  const result = AsyncData.Done(Result.Ok("one")).mapOk((x) => `${x}!`);
  expect(result).toEqual(AsyncData.Done(Result.Ok("one!")));
});

Deno.test("AsyncData mapOk", async () => {
  const result = AsyncData.Done(Result.Error("one")).mapOk((x) => `${x}!`);
  expect(result).toEqual(AsyncData.Done(Result.Error("one")));
});

Deno.test("AsyncData mapError", async () => {
  const result = AsyncData.Done(Result.Error("one")).mapError((x) => `${x}!`);
  expect(result).toEqual(AsyncData.Done(Result.Error("one!")));
});

Deno.test("AsyncData mapError ok", async () => {
  const result = AsyncData.Done(Result.Ok("one")).mapError((x) => `${x}!`);
  expect(result).toEqual(AsyncData.Done(Result.Ok("one")));
});

Deno.test("AsyncData mapOkToResult", async () => {
  const result = AsyncData.Done(Result.Ok("one")).mapOkToResult((x) =>
    Result.Ok(`${x}!`)
  );
  expect(result).toEqual(AsyncData.Done(Result.Ok("one!")));
});

Deno.test("AsyncData mapOkToResult", async () => {
  const result = AsyncData.Done(Result.Error("one")).mapOkToResult((x) =>
    Result.Ok(`${x}!`)
  );
  expect(result).toEqual(AsyncData.Done(Result.Error("one")));
});

Deno.test("AsyncData mapOkToResult", async () => {
  const result = AsyncData.Done(Result.Ok("one")).mapOkToResult((x) =>
    Result.Error(`${x}!`)
  );
  expect(result).toEqual(AsyncData.Done(Result.Error("one!")));
});

Deno.test("AsyncData mapErrorToResult", async () => {
  const result = AsyncData.Done(Result.Error("one")).mapErrorToResult((x) =>
    Result.Ok(`${x}!`)
  );
  expect(result).toEqual(AsyncData.Done(Result.Ok("one!")));
});

Deno.test("AsyncData mapErrorToResult", async () => {
  const result = AsyncData.Done(Result.Ok("one")).mapErrorToResult((x) =>
    Result.Ok(`${x}!`)
  );
  expect(result).toEqual(AsyncData.Done(Result.Ok("one")));
});

Deno.test("AsyncData mapErrorToResult", async () => {
  const result = AsyncData.Done(Result.Error("one")).mapErrorToResult((x) =>
    Result.Ok(`${x}!`)
  );
  expect(result).toEqual(AsyncData.Done(Result.Ok("one!")));
});

Deno.test("AsyncData flatMapOk", async () => {
  const result = AsyncData.Done(Result.Ok("one")).flatMapOk((x) =>
    AsyncData.Done(Result.Ok(`${x}!`))
  );
  expect(result).toEqual(AsyncData.Done(Result.Ok("one!")));
});

Deno.test("AsyncData flatMapOk", async () => {
  const result = AsyncData.Done(Result.Error("one")).flatMapOk((x) =>
    AsyncData.Done(Result.Ok(`${x}!`))
  );
  expect(result).toEqual(AsyncData.Done(Result.Error("one")));
});

Deno.test("AsyncData flatMapOk", async () => {
  const result = AsyncData.Done(Result.Ok("one")).flatMapOk((x) =>
    AsyncData.NotAsked()
  );
  expect(result).toEqual(AsyncData.NotAsked());
});

Deno.test("AsyncData flatMapOk", async () => {
  const result = AsyncData.Done(Result.Error("one")).flatMapOk((x) =>
    AsyncData.NotAsked()
  );
  expect(result).toEqual(AsyncData.Done(Result.Error("one")));
});

Deno.test("AsyncData flatMapError", async () => {
  const result = AsyncData.Done(Result.Error("one")).flatMapError((x) =>
    AsyncData.Done(Result.Error(`${x}!`))
  );
  expect(result).toEqual(AsyncData.Done(Result.Error("one!")));
});

Deno.test("AsyncData flatMapError ok", async () => {
  const result = AsyncData.Done(Result.Ok("one")).flatMapError((x) =>
    AsyncData.Done(Result.Ok(`${x}!`))
  );
  expect(result).toEqual(AsyncData.Done(Result.Ok("one")));
});

Deno.test("AsyncData flatMapError ok", async () => {
  const result = AsyncData.Done(Result.Ok("one")).flatMapError((x) =>
    AsyncData.Done(Result.Ok(`${x}!`))
  );
  expect(result).toEqual(AsyncData.Done(Result.Ok("one")));
});

Deno.test("AsyncData isAsyncData", async () => {
  expect(AsyncData.isAsyncData(AsyncData.Done(1))).toEqual(true);
  expect(AsyncData.isAsyncData(AsyncData.NotAsked())).toEqual(true);
  expect(AsyncData.isAsyncData(AsyncData.Loading())).toEqual(true);
  expect(AsyncData.isAsyncData(1)).toEqual(false);
  expect(AsyncData.isAsyncData([])).toEqual(false);
  expect(AsyncData.isAsyncData({})).toEqual(false);
});
