import { AsyncData } from "./AsyncData.ts";
import { Option, Result } from "./OptionResult.ts";
import { BOXED_TYPE } from "./symbols.ts";

export const encode = (value: any, indent?: number | undefined) => {
  return JSON.stringify(
    value,
    (key, value) => {
      if (typeof value[BOXED_TYPE] === "string") {
        return { ...value, __boxed_type__: value[BOXED_TYPE] };
      }
      return value;
    },
    indent,
  );
};

export const decode = (value: string) => {
  return JSON.parse(value, function (key, value) {
    if (value == null) {
      return value;
    }
    if (value.__boxed_type__ === "Option") {
      return Option.fromJSON(value);
    }
    if (value.__boxed_type__ === "Result") {
      return Result.fromJSON(value);
    }
    if (value.__boxed_type__ === "AsyncData") {
      return AsyncData.fromJSON(value);
    }
    return value;
  });
};
