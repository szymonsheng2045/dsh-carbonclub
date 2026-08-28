window.__ModuleLoader__.load({
	id: "dsh-human-buffer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/core.js
		var _a$1;
		function $constructor(name, initializer, params) {
			function init(inst, def) {
				if (!inst._zod) Object.defineProperty(inst, "_zod", {
					value: {
						def,
						constr: _,
						traits: /* @__PURE__ */ new Set()
					},
					enumerable: false
				});
				if (inst._zod.traits.has(name)) return;
				inst._zod.traits.add(name);
				initializer(inst, def);
				const proto = _.prototype;
				const keys = Object.keys(proto);
				for (let i = 0; i < keys.length; i++) {
					const k = keys[i];
					if (!(k in inst)) inst[k] = proto[k].bind(inst);
				}
			}
			const Parent = params?.Parent ?? Object;
			class Definition extends Parent {}
			Object.defineProperty(Definition, "name", { value: name });
			function _(def) {
				var _a;
				const inst = params?.Parent ? new Definition() : this;
				init(inst, def);
				(_a = inst._zod).deferred ?? (_a.deferred = []);
				for (const fn of inst._zod.deferred) fn();
				return inst;
			}
			Object.defineProperty(_, "init", { value: init });
			Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
				if (params?.Parent && inst instanceof params.Parent) return true;
				return inst?._zod?.traits?.has(name);
			} });
			Object.defineProperty(_, "name", { value: name });
			return _;
		}
		var $ZodAsyncError = class extends Error {
			constructor() {
				super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
			}
		};
		var $ZodEncodeError = class extends Error {
			constructor(name) {
				super(`Encountered unidirectional transform during encode: ${name}`);
				this.name = "ZodEncodeError";
			}
		};
		(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
		const globalConfig = globalThis.__zod_globalConfig;
		function config(newConfig) {
			if (newConfig) Object.assign(globalConfig, newConfig);
			return globalConfig;
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/util.js
		function getEnumValues(entries) {
			const numericValues = Object.values(entries).filter((v) => typeof v === "number");
			return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
		}
		function jsonStringifyReplacer(_, value) {
			if (typeof value === "bigint") return value.toString();
			return value;
		}
		function cached(getter) {
			return { get value() {
				{
					const value = getter();
					Object.defineProperty(this, "value", { value });
					return value;
				}
			} };
		}
		function nullish(input) {
			return input === null || input === void 0;
		}
		function cleanRegex(source) {
			const start = source.startsWith("^") ? 1 : 0;
			const end = source.endsWith("$") ? source.length - 1 : source.length;
			return source.slice(start, end);
		}
		function floatSafeRemainder(val, step) {
			const ratio = val / step;
			const roundedRatio = Math.round(ratio);
			const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
			if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
			return ratio - roundedRatio;
		}
		const EVALUATING = /* @__PURE__*/ Symbol("evaluating");
		function defineLazy(object, key, getter) {
			let value = void 0;
			Object.defineProperty(object, key, {
				get() {
					if (value === EVALUATING) return;
					if (value === void 0) {
						value = EVALUATING;
						value = getter();
					}
					return value;
				},
				set(v) {
					Object.defineProperty(object, key, { value: v });
				},
				configurable: true
			});
		}
		function assignProp(target, prop, value) {
			Object.defineProperty(target, prop, {
				value,
				writable: true,
				enumerable: true,
				configurable: true
			});
		}
		function mergeDefs(...defs) {
			const mergedDescriptors = {};
			for (const def of defs) {
				const descriptors = Object.getOwnPropertyDescriptors(def);
				Object.assign(mergedDescriptors, descriptors);
			}
			return Object.defineProperties({}, mergedDescriptors);
		}
		function esc(str) {
			return JSON.stringify(str);
		}
		function slugify(input) {
			return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
		}
		const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
		function isObject(data) {
			return typeof data === "object" && data !== null && !Array.isArray(data);
		}
		const allowsEval = /* @__PURE__*/ cached(() => {
			if (globalConfig.jitless) return false;
			if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
			try {
				new Function("");
				return true;
			} catch (_) {
				return false;
			}
		});
		function isPlainObject(o) {
			if (isObject(o) === false) return false;
			const ctor = o.constructor;
			if (ctor === void 0) return true;
			if (typeof ctor !== "function") return true;
			const prot = ctor.prototype;
			if (isObject(prot) === false) return false;
			if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
			return true;
		}
		function shallowClone(o) {
			if (isPlainObject(o)) return { ...o };
			if (Array.isArray(o)) return [...o];
			if (o instanceof Map) return new Map(o);
			if (o instanceof Set) return new Set(o);
			return o;
		}
		const propertyKeyTypes = /* @__PURE__*/ new Set([
			"string",
			"number",
			"symbol"
		]);
		function escapeRegex(str) {
			return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
		function clone(inst, def, params) {
			const cl = new inst._zod.constr(def ?? inst._zod.def);
			if (!def || params?.parent) cl._zod.parent = inst;
			return cl;
		}
		function normalizeParams(_params) {
			const params = _params;
			if (!params) return {};
			if (typeof params === "string") return { error: () => params };
			if (params?.message !== void 0) {
				if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
				params.error = params.message;
			}
			delete params.message;
			if (typeof params.error === "string") return {
				...params,
				error: () => params.error
			};
			return params;
		}
		function optionalKeys(shape) {
			return Object.keys(shape).filter((k) => {
				return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
			});
		}
		const NUMBER_FORMAT_RANGES = {
			safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
			int32: [-2147483648, 2147483647],
			uint32: [0, 4294967295],
			float32: [-34028234663852886e22, 34028234663852886e22],
			float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
		};
		function pick(schema, mask) {
			const currDef = schema._zod.def;
			const checks = currDef.checks;
			if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
			return clone(schema, mergeDefs(schema._zod.def, {
				get shape() {
					const newShape = {};
					for (const key in mask) {
						if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
						if (!mask[key]) continue;
						newShape[key] = currDef.shape[key];
					}
					assignProp(this, "shape", newShape);
					return newShape;
				},
				checks: []
			}));
		}
		function omit(schema, mask) {
			const currDef = schema._zod.def;
			const checks = currDef.checks;
			if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
			return clone(schema, mergeDefs(schema._zod.def, {
				get shape() {
					const newShape = { ...schema._zod.def.shape };
					for (const key in mask) {
						if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
						if (!mask[key]) continue;
						delete newShape[key];
					}
					assignProp(this, "shape", newShape);
					return newShape;
				},
				checks: []
			}));
		}
		function extend(schema, shape) {
			if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
			const checks = schema._zod.def.checks;
			if (checks && checks.length > 0) {
				const existingShape = schema._zod.def.shape;
				for (const key in shape) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
			}
			return clone(schema, mergeDefs(schema._zod.def, { get shape() {
				const _shape = {
					...schema._zod.def.shape,
					...shape
				};
				assignProp(this, "shape", _shape);
				return _shape;
			} }));
		}
		function safeExtend(schema, shape) {
			if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
			return clone(schema, mergeDefs(schema._zod.def, { get shape() {
				const _shape = {
					...schema._zod.def.shape,
					...shape
				};
				assignProp(this, "shape", _shape);
				return _shape;
			} }));
		}
		function merge(a, b) {
			if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
			return clone(a, mergeDefs(a._zod.def, {
				get shape() {
					const _shape = {
						...a._zod.def.shape,
						...b._zod.def.shape
					};
					assignProp(this, "shape", _shape);
					return _shape;
				},
				get catchall() {
					return b._zod.def.catchall;
				},
				checks: b._zod.def.checks ?? []
			}));
		}
		function partial(Class, schema, mask) {
			const checks = schema._zod.def.checks;
			if (checks && checks.length > 0) throw new Error(".partial() cannot be used on object schemas containing refinements");
			return clone(schema, mergeDefs(schema._zod.def, {
				get shape() {
					const oldShape = schema._zod.def.shape;
					const shape = { ...oldShape };
					if (mask) for (const key in mask) {
						if (!(key in oldShape)) throw new Error(`Unrecognized key: "${key}"`);
						if (!mask[key]) continue;
						shape[key] = Class ? new Class({
							type: "optional",
							innerType: oldShape[key]
						}) : oldShape[key];
					}
					else for (const key in oldShape) shape[key] = Class ? new Class({
						type: "optional",
						innerType: oldShape[key]
					}) : oldShape[key];
					assignProp(this, "shape", shape);
					return shape;
				},
				checks: []
			}));
		}
		function required(Class, schema, mask) {
			return clone(schema, mergeDefs(schema._zod.def, { get shape() {
				const oldShape = schema._zod.def.shape;
				const shape = { ...oldShape };
				if (mask) for (const key in mask) {
					if (!(key in shape)) throw new Error(`Unrecognized key: "${key}"`);
					if (!mask[key]) continue;
					shape[key] = new Class({
						type: "nonoptional",
						innerType: oldShape[key]
					});
				}
				else for (const key in oldShape) shape[key] = new Class({
					type: "nonoptional",
					innerType: oldShape[key]
				});
				assignProp(this, "shape", shape);
				return shape;
			} }));
		}
		function aborted(x, startIndex = 0) {
			if (x.aborted === true) return true;
			for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
			return false;
		}
		function explicitlyAborted(x, startIndex = 0) {
			if (x.aborted === true) return true;
			for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
			return false;
		}
		function prefixIssues(path, issues) {
			return issues.map((iss) => {
				var _a;
				(_a = iss).path ?? (_a.path = []);
				iss.path.unshift(path);
				return iss;
			});
		}
		function unwrapMessage(message) {
			return typeof message === "string" ? message : message?.message;
		}
		function finalizeIssue(iss, ctx, config) {
			const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
			const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
			rest.path ?? (rest.path = []);
			rest.message = message;
			if (ctx?.reportInput) rest.input = _input;
			return rest;
		}
		function getLengthableOrigin(input) {
			if (Array.isArray(input)) return "array";
			if (typeof input === "string") return "string";
			return "unknown";
		}
		function issue(...args) {
			const [iss, input, inst] = args;
			if (typeof iss === "string") return {
				message: iss,
				code: "custom",
				input,
				inst
			};
			return { ...iss };
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/errors.js
		const initializer$1 = (inst, def) => {
			inst.name = "$ZodError";
			Object.defineProperty(inst, "_zod", {
				value: inst._zod,
				enumerable: false
			});
			Object.defineProperty(inst, "issues", {
				value: def,
				enumerable: false
			});
			inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
			Object.defineProperty(inst, "toString", {
				value: () => inst.message,
				enumerable: false
			});
		};
		const $ZodError = $constructor("$ZodError", initializer$1);
		const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
		function flattenError(error, mapper = (issue) => issue.message) {
			const fieldErrors = {};
			const formErrors = [];
			for (const sub of error.issues) if (sub.path.length > 0) {
				fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
				fieldErrors[sub.path[0]].push(mapper(sub));
			} else formErrors.push(mapper(sub));
			return {
				formErrors,
				fieldErrors
			};
		}
		function formatError(error, mapper = (issue) => issue.message) {
			const fieldErrors = { _errors: [] };
			const processError = (error, path = []) => {
				for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
				else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
				else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
				else {
					const fullpath = [...path, ...issue.path];
					if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
					else {
						let curr = fieldErrors;
						let i = 0;
						while (i < fullpath.length) {
							const el = fullpath[i];
							if (!(i === fullpath.length - 1)) curr[el] = curr[el] || { _errors: [] };
							else {
								curr[el] = curr[el] || { _errors: [] };
								curr[el]._errors.push(mapper(issue));
							}
							curr = curr[el];
							i++;
						}
					}
				}
			};
			processError(error);
			return fieldErrors;
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/parse.js
		const _parse = (_Err) => (schema, value, _ctx, _params) => {
			const ctx = _ctx ? {
				..._ctx,
				async: false
			} : { async: false };
			const result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) throw new $ZodAsyncError();
			if (result.issues.length) {
				const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
				captureStackTrace(e, _params?.callee);
				throw e;
			}
			return result.value;
		};
		const _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
			const ctx = _ctx ? {
				..._ctx,
				async: true
			} : { async: true };
			let result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) result = await result;
			if (result.issues.length) {
				const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
				captureStackTrace(e, params?.callee);
				throw e;
			}
			return result.value;
		};
		const _safeParse = (_Err) => (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				async: false
			} : { async: false };
			const result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) throw new $ZodAsyncError();
			return result.issues.length ? {
				success: false,
				error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
			} : {
				success: true,
				data: result.value
			};
		};
		const safeParse$1 = /* @__PURE__*/ _safeParse($ZodRealError);
		const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				async: true
			} : { async: true };
			let result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) result = await result;
			return result.issues.length ? {
				success: false,
				error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
			} : {
				success: true,
				data: result.value
			};
		};
		const safeParseAsync$1 = /* @__PURE__*/ _safeParseAsync($ZodRealError);
		const _encode = (_Err) => (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _parse(_Err)(schema, value, ctx);
		};
		const _decode = (_Err) => (schema, value, _ctx) => {
			return _parse(_Err)(schema, value, _ctx);
		};
		const _encodeAsync = (_Err) => async (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _parseAsync(_Err)(schema, value, ctx);
		};
		const _decodeAsync = (_Err) => async (schema, value, _ctx) => {
			return _parseAsync(_Err)(schema, value, _ctx);
		};
		const _safeEncode = (_Err) => (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _safeParse(_Err)(schema, value, ctx);
		};
		const _safeDecode = (_Err) => (schema, value, _ctx) => {
			return _safeParse(_Err)(schema, value, _ctx);
		};
		const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _safeParseAsync(_Err)(schema, value, ctx);
		};
		const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
			return _safeParseAsync(_Err)(schema, value, _ctx);
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/regexes.js
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link cuid2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		const cuid = /^[cC][0-9a-z]{6,}$/;
		const cuid2 = /^[0-9a-z]+$/;
		const ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
		const xid = /^[0-9a-vA-V]{20}$/;
		const ksuid = /^[A-Za-z0-9]{27}$/;
		const nanoid = /^[a-zA-Z0-9_-]{21}$/;
		/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
		const duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
		/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
		const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
		/** Returns a regex for validating an RFC 9562/4122 UUID.
		*
		* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
		const uuid = (version) => {
			if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
			return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
		};
		/** Practical email validation */
		const email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
		const _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
		function emoji() {
			return new RegExp(_emoji$1, "u");
		}
		const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
		const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
		const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
		const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
		const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
		const base64url = /^[A-Za-z0-9_-]*$/;
		const httpProtocol = /^https?$/;
		const e164 = /^\+[1-9]\d{6,14}$/;
		const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
		const date$1 = /*@__PURE__*/ new RegExp(`^${dateSource}$`);
		function timeSource(args) {
			const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
			return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
		}
		function time$1(args) {
			return new RegExp(`^${timeSource(args)}$`);
		}
		function datetime$1(args) {
			const time = timeSource({ precision: args.precision });
			const opts = ["Z"];
			if (args.local) opts.push("");
			if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
			const timeRegex = `${time}(?:${opts.join("|")})`;
			return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
		}
		const string$1 = (params) => {
			const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
			return new RegExp(`^${regex}$`);
		};
		const integer = /^-?\d+$/;
		const number$1 = /^-?\d+(?:\.\d+)?$/;
		const boolean$1 = /^(?:true|false)$/i;
		const lowercase = /^[^A-Z]*$/;
		const uppercase = /^[^a-z]*$/;
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/checks.js
		const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
			var _a;
			inst._zod ?? (inst._zod = {});
			inst._zod.def = def;
			(_a = inst._zod).onattach ?? (_a.onattach = []);
		});
		const numericOriginMap = {
			number: "number",
			bigint: "bigint",
			object: "date"
		};
		const $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
			$ZodCheck.init(inst, def);
			const origin = numericOriginMap[typeof def.value];
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
				if (def.value < curr) {
					if (def.inclusive) bag.maximum = def.value;
					else bag.exclusiveMaximum = def.value;
				}
			});
			inst._zod.check = (payload) => {
				if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
				payload.issues.push({
					origin,
					code: "too_big",
					maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
					input: payload.value,
					inclusive: def.inclusive,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
			$ZodCheck.init(inst, def);
			const origin = numericOriginMap[typeof def.value];
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
				if (def.value > curr) {
					if (def.inclusive) bag.minimum = def.value;
					else bag.exclusiveMinimum = def.value;
				}
			});
			inst._zod.check = (payload) => {
				if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
				payload.issues.push({
					origin,
					code: "too_small",
					minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
					input: payload.value,
					inclusive: def.inclusive,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
			$ZodCheck.init(inst, def);
			inst._zod.onattach.push((inst) => {
				var _a;
				(_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
			});
			inst._zod.check = (payload) => {
				if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
				if (typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
				payload.issues.push({
					origin: typeof payload.value,
					code: "not_multiple_of",
					divisor: def.value,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
			$ZodCheck.init(inst, def);
			def.format = def.format || "float64";
			const isInt = def.format?.includes("int");
			const origin = isInt ? "int" : "number";
			const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.format = def.format;
				bag.minimum = minimum;
				bag.maximum = maximum;
				if (isInt) bag.pattern = integer;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				if (isInt) {
					if (!Number.isInteger(input)) {
						payload.issues.push({
							expected: origin,
							format: def.format,
							code: "invalid_type",
							continue: false,
							input,
							inst
						});
						return;
					}
					if (!Number.isSafeInteger(input)) {
						if (input > 0) payload.issues.push({
							input,
							code: "too_big",
							maximum: Number.MAX_SAFE_INTEGER,
							note: "Integers must be within the safe integer range.",
							inst,
							origin,
							inclusive: true,
							continue: !def.abort
						});
						else payload.issues.push({
							input,
							code: "too_small",
							minimum: Number.MIN_SAFE_INTEGER,
							note: "Integers must be within the safe integer range.",
							inst,
							origin,
							inclusive: true,
							continue: !def.abort
						});
						return;
					}
				}
				if (input < minimum) payload.issues.push({
					origin: "number",
					input,
					code: "too_small",
					minimum,
					inclusive: true,
					inst,
					continue: !def.abort
				});
				if (input > maximum) payload.issues.push({
					origin: "number",
					input,
					code: "too_big",
					maximum,
					inclusive: true,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
			var _a;
			$ZodCheck.init(inst, def);
			(_a = inst._zod.def).when ?? (_a.when = (payload) => {
				const val = payload.value;
				return !nullish(val) && val.length !== void 0;
			});
			inst._zod.onattach.push((inst) => {
				const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
				if (def.maximum < curr) inst._zod.bag.maximum = def.maximum;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				if (input.length <= def.maximum) return;
				const origin = getLengthableOrigin(input);
				payload.issues.push({
					origin,
					code: "too_big",
					maximum: def.maximum,
					inclusive: true,
					input,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
			var _a;
			$ZodCheck.init(inst, def);
			(_a = inst._zod.def).when ?? (_a.when = (payload) => {
				const val = payload.value;
				return !nullish(val) && val.length !== void 0;
			});
			inst._zod.onattach.push((inst) => {
				const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
				if (def.minimum > curr) inst._zod.bag.minimum = def.minimum;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				if (input.length >= def.minimum) return;
				const origin = getLengthableOrigin(input);
				payload.issues.push({
					origin,
					code: "too_small",
					minimum: def.minimum,
					inclusive: true,
					input,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
			var _a;
			$ZodCheck.init(inst, def);
			(_a = inst._zod.def).when ?? (_a.when = (payload) => {
				const val = payload.value;
				return !nullish(val) && val.length !== void 0;
			});
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.minimum = def.length;
				bag.maximum = def.length;
				bag.length = def.length;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				const length = input.length;
				if (length === def.length) return;
				const origin = getLengthableOrigin(input);
				const tooBig = length > def.length;
				payload.issues.push({
					origin,
					...tooBig ? {
						code: "too_big",
						maximum: def.length
					} : {
						code: "too_small",
						minimum: def.length
					},
					inclusive: true,
					exact: true,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
			var _a, _b;
			$ZodCheck.init(inst, def);
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.format = def.format;
				if (def.pattern) {
					bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
					bag.patterns.add(def.pattern);
				}
			});
			if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
				def.pattern.lastIndex = 0;
				if (def.pattern.test(payload.value)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: def.format,
					input: payload.value,
					...def.pattern ? { pattern: def.pattern.toString() } : {},
					inst,
					continue: !def.abort
				});
			});
			else (_b = inst._zod).check ?? (_b.check = () => {});
		});
		const $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
			$ZodCheckStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				def.pattern.lastIndex = 0;
				if (def.pattern.test(payload.value)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "regex",
					input: payload.value,
					pattern: def.pattern.toString(),
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
			def.pattern ?? (def.pattern = lowercase);
			$ZodCheckStringFormat.init(inst, def);
		});
		const $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
			def.pattern ?? (def.pattern = uppercase);
			$ZodCheckStringFormat.init(inst, def);
		});
		const $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
			$ZodCheck.init(inst, def);
			const escapedRegex = escapeRegex(def.includes);
			const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
			def.pattern = pattern;
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
				bag.patterns.add(pattern);
			});
			inst._zod.check = (payload) => {
				if (payload.value.includes(def.includes, def.position)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "includes",
					includes: def.includes,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
			$ZodCheck.init(inst, def);
			const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
			def.pattern ?? (def.pattern = pattern);
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
				bag.patterns.add(pattern);
			});
			inst._zod.check = (payload) => {
				if (payload.value.startsWith(def.prefix)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "starts_with",
					prefix: def.prefix,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
			$ZodCheck.init(inst, def);
			const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
			def.pattern ?? (def.pattern = pattern);
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
				bag.patterns.add(pattern);
			});
			inst._zod.check = (payload) => {
				if (payload.value.endsWith(def.suffix)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "ends_with",
					suffix: def.suffix,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
			$ZodCheck.init(inst, def);
			inst._zod.check = (payload) => {
				payload.value = def.tx(payload.value);
			};
		});
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/doc.js
		var Doc = class {
			constructor(args = []) {
				this.content = [];
				this.indent = 0;
				if (this) this.args = args;
			}
			indented(fn) {
				this.indent += 1;
				fn(this);
				this.indent -= 1;
			}
			write(arg) {
				if (typeof arg === "function") {
					arg(this, { execution: "sync" });
					arg(this, { execution: "async" });
					return;
				}
				const lines = arg.split("\n").filter((x) => x);
				const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
				const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
				for (const line of dedented) this.content.push(line);
			}
			compile() {
				const F = Function;
				const args = this?.args;
				const lines = [...(this?.content ?? [``]).map((x) => `  ${x}`)];
				return new F(...args, lines.join("\n"));
			}
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/versions.js
		const version = {
			major: 4,
			minor: 4,
			patch: 3
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/schemas.js
		const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
			var _a;
			inst ?? (inst = {});
			inst._zod.def = def;
			inst._zod.bag = inst._zod.bag || {};
			inst._zod.version = version;
			const checks = [...inst._zod.def.checks ?? []];
			if (inst._zod.traits.has("$ZodCheck")) checks.unshift(inst);
			for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
			if (checks.length === 0) {
				(_a = inst._zod).deferred ?? (_a.deferred = []);
				inst._zod.deferred?.push(() => {
					inst._zod.run = inst._zod.parse;
				});
			} else {
				const runChecks = (payload, checks, ctx) => {
					let isAborted = aborted(payload);
					let asyncResult;
					for (const ch of checks) {
						if (ch._zod.def.when) {
							if (explicitlyAborted(payload)) continue;
							if (!ch._zod.def.when(payload)) continue;
						} else if (isAborted) continue;
						const currLen = payload.issues.length;
						const _ = ch._zod.check(payload);
						if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
						if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
							await _;
							if (payload.issues.length === currLen) return;
							if (!isAborted) isAborted = aborted(payload, currLen);
						});
						else {
							if (payload.issues.length === currLen) continue;
							if (!isAborted) isAborted = aborted(payload, currLen);
						}
					}
					if (asyncResult) return asyncResult.then(() => {
						return payload;
					});
					return payload;
				};
				const handleCanaryResult = (canary, payload, ctx) => {
					if (aborted(canary)) {
						canary.aborted = true;
						return canary;
					}
					const checkResult = runChecks(payload, checks, ctx);
					if (checkResult instanceof Promise) {
						if (ctx.async === false) throw new $ZodAsyncError();
						return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
					}
					return inst._zod.parse(checkResult, ctx);
				};
				inst._zod.run = (payload, ctx) => {
					if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
					if (ctx.direction === "backward") {
						const canary = inst._zod.parse({
							value: payload.value,
							issues: []
						}, {
							...ctx,
							skipChecks: true
						});
						if (canary instanceof Promise) return canary.then((canary) => {
							return handleCanaryResult(canary, payload, ctx);
						});
						return handleCanaryResult(canary, payload, ctx);
					}
					const result = inst._zod.parse(payload, ctx);
					if (result instanceof Promise) {
						if (ctx.async === false) throw new $ZodAsyncError();
						return result.then((result) => runChecks(result, checks, ctx));
					}
					return runChecks(result, checks, ctx);
				};
			}
			defineLazy(inst, "~standard", () => ({
				validate: (value) => {
					try {
						const r = safeParse$1(inst, value);
						return r.success ? { value: r.data } : { issues: r.error?.issues };
					} catch (_) {
						return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
					}
				},
				vendor: "zod",
				version: 1
			}));
		});
		const $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
			inst._zod.parse = (payload, _) => {
				if (def.coerce) try {
					payload.value = String(payload.value);
				} catch (_) {}
				if (typeof payload.value === "string") return payload;
				payload.issues.push({
					expected: "string",
					code: "invalid_type",
					input: payload.value,
					inst
				});
				return payload;
			};
		});
		const $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
			$ZodCheckStringFormat.init(inst, def);
			$ZodString.init(inst, def);
		});
		const $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
			def.pattern ?? (def.pattern = guid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
			if (def.version) {
				const v = {
					v1: 1,
					v2: 2,
					v3: 3,
					v4: 4,
					v5: 5,
					v6: 6,
					v7: 7,
					v8: 8
				}[def.version];
				if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
				def.pattern ?? (def.pattern = uuid(v));
			} else def.pattern ?? (def.pattern = uuid());
			$ZodStringFormat.init(inst, def);
		});
		const $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
			def.pattern ?? (def.pattern = email);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
			$ZodStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				try {
					const trimmed = payload.value.trim();
					if (!def.normalize && def.protocol?.source === httpProtocol.source) {
						if (!/^https?:\/\//i.test(trimmed)) {
							payload.issues.push({
								code: "invalid_format",
								format: "url",
								note: "Invalid URL format",
								input: payload.value,
								inst,
								continue: !def.abort
							});
							return;
						}
					}
					const url = new URL(trimmed);
					if (def.hostname) {
						def.hostname.lastIndex = 0;
						if (!def.hostname.test(url.hostname)) payload.issues.push({
							code: "invalid_format",
							format: "url",
							note: "Invalid hostname",
							pattern: def.hostname.source,
							input: payload.value,
							inst,
							continue: !def.abort
						});
					}
					if (def.protocol) {
						def.protocol.lastIndex = 0;
						if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) payload.issues.push({
							code: "invalid_format",
							format: "url",
							note: "Invalid protocol",
							pattern: def.protocol.source,
							input: payload.value,
							inst,
							continue: !def.abort
						});
					}
					if (def.normalize) payload.value = url.href;
					else payload.value = trimmed;
					return;
				} catch (_) {
					payload.issues.push({
						code: "invalid_format",
						format: "url",
						input: payload.value,
						inst,
						continue: !def.abort
					});
				}
			};
		});
		const $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
			def.pattern ?? (def.pattern = emoji());
			$ZodStringFormat.init(inst, def);
		});
		const $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
			def.pattern ?? (def.pattern = nanoid);
			$ZodStringFormat.init(inst, def);
		});
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		const $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
			def.pattern ?? (def.pattern = cuid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
			def.pattern ?? (def.pattern = cuid2);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
			def.pattern ?? (def.pattern = ulid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
			def.pattern ?? (def.pattern = xid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
			def.pattern ?? (def.pattern = ksuid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
			def.pattern ?? (def.pattern = datetime$1(def));
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
			def.pattern ?? (def.pattern = date$1);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
			def.pattern ?? (def.pattern = time$1(def));
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
			def.pattern ?? (def.pattern = duration$1);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
			def.pattern ?? (def.pattern = ipv4);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.format = `ipv4`;
		});
		const $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
			def.pattern ?? (def.pattern = ipv6);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.format = `ipv6`;
			inst._zod.check = (payload) => {
				try {
					new URL(`http://[${payload.value}]`);
				} catch {
					payload.issues.push({
						code: "invalid_format",
						format: "ipv6",
						input: payload.value,
						inst,
						continue: !def.abort
					});
				}
			};
		});
		const $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
			def.pattern ?? (def.pattern = cidrv4);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
			def.pattern ?? (def.pattern = cidrv6);
			$ZodStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				const parts = payload.value.split("/");
				try {
					if (parts.length !== 2) throw new Error();
					const [address, prefix] = parts;
					if (!prefix) throw new Error();
					const prefixNum = Number(prefix);
					if (`${prefixNum}` !== prefix) throw new Error();
					if (prefixNum < 0 || prefixNum > 128) throw new Error();
					new URL(`http://[${address}]`);
				} catch {
					payload.issues.push({
						code: "invalid_format",
						format: "cidrv6",
						input: payload.value,
						inst,
						continue: !def.abort
					});
				}
			};
		});
		function isValidBase64(data) {
			if (data === "") return true;
			if (/\s/.test(data)) return false;
			if (data.length % 4 !== 0) return false;
			try {
				atob(data);
				return true;
			} catch {
				return false;
			}
		}
		const $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
			def.pattern ?? (def.pattern = base64);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.contentEncoding = "base64";
			inst._zod.check = (payload) => {
				if (isValidBase64(payload.value)) return;
				payload.issues.push({
					code: "invalid_format",
					format: "base64",
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		function isValidBase64URL(data) {
			if (!base64url.test(data)) return false;
			const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
			return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
		}
		const $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
			def.pattern ?? (def.pattern = base64url);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.contentEncoding = "base64url";
			inst._zod.check = (payload) => {
				if (isValidBase64URL(payload.value)) return;
				payload.issues.push({
					code: "invalid_format",
					format: "base64url",
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
			def.pattern ?? (def.pattern = e164);
			$ZodStringFormat.init(inst, def);
		});
		function isValidJWT(token, algorithm = null) {
			try {
				const tokensParts = token.split(".");
				if (tokensParts.length !== 3) return false;
				const [header] = tokensParts;
				if (!header) return false;
				const parsedHeader = JSON.parse(atob(header));
				if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
				if (!parsedHeader.alg) return false;
				if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
				return true;
			} catch {
				return false;
			}
		}
		const $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
			$ZodStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				if (isValidJWT(payload.value, def.alg)) return;
				payload.issues.push({
					code: "invalid_format",
					format: "jwt",
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
			inst._zod.parse = (payload, _ctx) => {
				if (def.coerce) try {
					payload.value = Number(payload.value);
				} catch (_) {}
				const input = payload.value;
				if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
				const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
				payload.issues.push({
					expected: "number",
					code: "invalid_type",
					input,
					inst,
					...received ? { received } : {}
				});
				return payload;
			};
		});
		const $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
			$ZodCheckNumberFormat.init(inst, def);
			$ZodNumber.init(inst, def);
		});
		const $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.pattern = boolean$1;
			inst._zod.parse = (payload, _ctx) => {
				if (def.coerce) try {
					payload.value = Boolean(payload.value);
				} catch (_) {}
				const input = payload.value;
				if (typeof input === "boolean") return payload;
				payload.issues.push({
					expected: "boolean",
					code: "invalid_type",
					input,
					inst
				});
				return payload;
			};
		});
		const $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload) => payload;
		});
		const $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, _ctx) => {
				payload.issues.push({
					expected: "never",
					code: "invalid_type",
					input: payload.value,
					inst
				});
				return payload;
			};
		});
		function handleArrayResult(result, final, index) {
			if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
			final.value[index] = result.value;
		}
		const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, ctx) => {
				const input = payload.value;
				if (!Array.isArray(input)) {
					payload.issues.push({
						expected: "array",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				payload.value = Array(input.length);
				const proms = [];
				for (let i = 0; i < input.length; i++) {
					const item = input[i];
					const result = def.element._zod.run({
						value: item,
						issues: []
					}, ctx);
					if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
					else handleArrayResult(result, payload, i);
				}
				if (proms.length) return Promise.all(proms).then(() => payload);
				return payload;
			};
		});
		function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
			const isPresent = key in input;
			if (result.issues.length) {
				if (isOptionalIn && isOptionalOut && !isPresent) return;
				final.issues.push(...prefixIssues(key, result.issues));
			}
			if (!isPresent && !isOptionalIn) {
				if (!result.issues.length) final.issues.push({
					code: "invalid_type",
					expected: "nonoptional",
					input: void 0,
					path: [key]
				});
				return;
			}
			if (result.value === void 0) {
				if (isPresent) final.value[key] = void 0;
			} else final.value[key] = result.value;
		}
		function normalizeDef(def) {
			const keys = Object.keys(def.shape);
			for (const k of keys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
			const okeys = optionalKeys(def.shape);
			return {
				...def,
				keys,
				keySet: new Set(keys),
				numKeys: keys.length,
				optionalKeys: new Set(okeys)
			};
		}
		function handleCatchall(proms, input, payload, ctx, def, inst) {
			const unrecognized = [];
			const keySet = def.keySet;
			const _catchall = def.catchall._zod;
			const t = _catchall.def.type;
			const isOptionalIn = _catchall.optin === "optional";
			const isOptionalOut = _catchall.optout === "optional";
			for (const key in input) {
				if (key === "__proto__") continue;
				if (keySet.has(key)) continue;
				if (t === "never") {
					unrecognized.push(key);
					continue;
				}
				const r = _catchall.run({
					value: input[key],
					issues: []
				}, ctx);
				if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
				else handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
			}
			if (unrecognized.length) payload.issues.push({
				code: "unrecognized_keys",
				keys: unrecognized,
				input,
				inst
			});
			if (!proms.length) return payload;
			return Promise.all(proms).then(() => {
				return payload;
			});
		}
		const $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
			$ZodType.init(inst, def);
			if (!Object.getOwnPropertyDescriptor(def, "shape")?.get) {
				const sh = def.shape;
				Object.defineProperty(def, "shape", { get: () => {
					const newSh = { ...sh };
					Object.defineProperty(def, "shape", { value: newSh });
					return newSh;
				} });
			}
			const _normalized = cached(() => normalizeDef(def));
			defineLazy(inst._zod, "propValues", () => {
				const shape = def.shape;
				const propValues = {};
				for (const key in shape) {
					const field = shape[key]._zod;
					if (field.values) {
						propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
						for (const v of field.values) propValues[key].add(v);
					}
				}
				return propValues;
			});
			const isObject$1 = isObject;
			const catchall = def.catchall;
			let value;
			inst._zod.parse = (payload, ctx) => {
				value ?? (value = _normalized.value);
				const input = payload.value;
				if (!isObject$1(input)) {
					payload.issues.push({
						expected: "object",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				payload.value = {};
				const proms = [];
				const shape = value.shape;
				for (const key of value.keys) {
					const el = shape[key];
					const isOptionalIn = el._zod.optin === "optional";
					const isOptionalOut = el._zod.optout === "optional";
					const r = el._zod.run({
						value: input[key],
						issues: []
					}, ctx);
					if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
					else handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
				}
				if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
				return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
			};
		});
		const $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
			$ZodObject.init(inst, def);
			const superParse = inst._zod.parse;
			const _normalized = cached(() => normalizeDef(def));
			const generateFastpass = (shape) => {
				const doc = new Doc([
					"shape",
					"payload",
					"ctx"
				]);
				const normalized = _normalized.value;
				const parseStr = (key) => {
					const k = esc(key);
					return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
				};
				doc.write(`const input = payload.value;`);
				const ids = Object.create(null);
				let counter = 0;
				for (const key of normalized.keys) ids[key] = `key_${counter++}`;
				doc.write(`const newResult = {};`);
				for (const key of normalized.keys) {
					const id = ids[key];
					const k = esc(key);
					const schema = shape[key];
					const isOptionalIn = schema?._zod?.optin === "optional";
					const isOptionalOut = schema?._zod?.optout === "optional";
					doc.write(`const ${id} = ${parseStr(key)};`);
					if (isOptionalIn && isOptionalOut) doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
					else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
					else doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
				}
				doc.write(`payload.value = newResult;`);
				doc.write(`return payload;`);
				const fn = doc.compile();
				return (payload, ctx) => fn(shape, payload, ctx);
			};
			let fastpass;
			const isObject$2 = isObject;
			const jit = !globalConfig.jitless;
			const fastEnabled = jit && allowsEval.value;
			const catchall = def.catchall;
			let value;
			inst._zod.parse = (payload, ctx) => {
				value ?? (value = _normalized.value);
				const input = payload.value;
				if (!isObject$2(input)) {
					payload.issues.push({
						expected: "object",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
					if (!fastpass) fastpass = generateFastpass(def.shape);
					payload = fastpass(payload, ctx);
					if (!catchall) return payload;
					return handleCatchall([], input, payload, ctx, value, inst);
				}
				return superParse(payload, ctx);
			};
		});
		function handleUnionResults(results, final, inst, ctx) {
			for (const result of results) if (result.issues.length === 0) {
				final.value = result.value;
				return final;
			}
			const nonaborted = results.filter((r) => !aborted(r));
			if (nonaborted.length === 1) {
				final.value = nonaborted[0].value;
				return nonaborted[0];
			}
			final.issues.push({
				code: "invalid_union",
				input: final.value,
				inst,
				errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
			});
			return final;
		}
		const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
			defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
			defineLazy(inst._zod, "values", () => {
				if (def.options.every((o) => o._zod.values)) return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
			});
			defineLazy(inst._zod, "pattern", () => {
				if (def.options.every((o) => o._zod.pattern)) {
					const patterns = def.options.map((o) => o._zod.pattern);
					return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
				}
			});
			const first = def.options.length === 1 ? def.options[0]._zod.run : null;
			inst._zod.parse = (payload, ctx) => {
				if (first) return first(payload, ctx);
				let async = false;
				const results = [];
				for (const option of def.options) {
					const result = option._zod.run({
						value: payload.value,
						issues: []
					}, ctx);
					if (result instanceof Promise) {
						results.push(result);
						async = true;
					} else {
						if (result.issues.length === 0) return result;
						results.push(result);
					}
				}
				if (!async) return handleUnionResults(results, payload, inst, ctx);
				return Promise.all(results).then((results) => {
					return handleUnionResults(results, payload, inst, ctx);
				});
			};
		});
		const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, ctx) => {
				const input = payload.value;
				const left = def.left._zod.run({
					value: input,
					issues: []
				}, ctx);
				const right = def.right._zod.run({
					value: input,
					issues: []
				}, ctx);
				if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
					return handleIntersectionResults(payload, left, right);
				});
				return handleIntersectionResults(payload, left, right);
			};
		});
		function mergeValues(a, b) {
			if (a === b) return {
				valid: true,
				data: a
			};
			if (a instanceof Date && b instanceof Date && +a === +b) return {
				valid: true,
				data: a
			};
			if (isPlainObject(a) && isPlainObject(b)) {
				const bKeys = Object.keys(b);
				const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
				const newObj = {
					...a,
					...b
				};
				for (const key of sharedKeys) {
					const sharedValue = mergeValues(a[key], b[key]);
					if (!sharedValue.valid) return {
						valid: false,
						mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
					};
					newObj[key] = sharedValue.data;
				}
				return {
					valid: true,
					data: newObj
				};
			}
			if (Array.isArray(a) && Array.isArray(b)) {
				if (a.length !== b.length) return {
					valid: false,
					mergeErrorPath: []
				};
				const newArray = [];
				for (let index = 0; index < a.length; index++) {
					const itemA = a[index];
					const itemB = b[index];
					const sharedValue = mergeValues(itemA, itemB);
					if (!sharedValue.valid) return {
						valid: false,
						mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
					};
					newArray.push(sharedValue.data);
				}
				return {
					valid: true,
					data: newArray
				};
			}
			return {
				valid: false,
				mergeErrorPath: []
			};
		}
		function handleIntersectionResults(result, left, right) {
			const unrecKeys = /* @__PURE__ */ new Map();
			let unrecIssue;
			for (const iss of left.issues) if (iss.code === "unrecognized_keys") {
				unrecIssue ?? (unrecIssue = iss);
				for (const k of iss.keys) {
					if (!unrecKeys.has(k)) unrecKeys.set(k, {});
					unrecKeys.get(k).l = true;
				}
			} else result.issues.push(iss);
			for (const iss of right.issues) if (iss.code === "unrecognized_keys") for (const k of iss.keys) {
				if (!unrecKeys.has(k)) unrecKeys.set(k, {});
				unrecKeys.get(k).r = true;
			}
			else result.issues.push(iss);
			const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
			if (bothKeys.length && unrecIssue) result.issues.push({
				...unrecIssue,
				keys: bothKeys
			});
			if (aborted(result)) return result;
			const merged = mergeValues(left.value, right.value);
			if (!merged.valid) throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
			result.value = merged.data;
			return result;
		}
		const $ZodRecord = /*@__PURE__*/ $constructor("$ZodRecord", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, ctx) => {
				const input = payload.value;
				if (!isPlainObject(input)) {
					payload.issues.push({
						expected: "record",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				const proms = [];
				const values = def.keyType._zod.values;
				if (values) {
					payload.value = {};
					const recordKeys = /* @__PURE__ */ new Set();
					for (const key of values) if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
						recordKeys.add(typeof key === "number" ? key.toString() : key);
						const keyResult = def.keyType._zod.run({
							value: key,
							issues: []
						}, ctx);
						if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
						if (keyResult.issues.length) {
							payload.issues.push({
								code: "invalid_key",
								origin: "record",
								issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
								input: key,
								path: [key],
								inst
							});
							continue;
						}
						const outKey = keyResult.value;
						const result = def.valueType._zod.run({
							value: input[key],
							issues: []
						}, ctx);
						if (result instanceof Promise) proms.push(result.then((result) => {
							if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
							payload.value[outKey] = result.value;
						}));
						else {
							if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
							payload.value[outKey] = result.value;
						}
					}
					let unrecognized;
					for (const key in input) if (!recordKeys.has(key)) {
						unrecognized = unrecognized ?? [];
						unrecognized.push(key);
					}
					if (unrecognized && unrecognized.length > 0) payload.issues.push({
						code: "unrecognized_keys",
						input,
						inst,
						keys: unrecognized
					});
				} else {
					payload.value = {};
					for (const key of Reflect.ownKeys(input)) {
						if (key === "__proto__") continue;
						if (!Object.prototype.propertyIsEnumerable.call(input, key)) continue;
						let keyResult = def.keyType._zod.run({
							value: key,
							issues: []
						}, ctx);
						if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
						if (typeof key === "string" && number$1.test(key) && keyResult.issues.length) {
							const retryResult = def.keyType._zod.run({
								value: Number(key),
								issues: []
							}, ctx);
							if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
							if (retryResult.issues.length === 0) keyResult = retryResult;
						}
						if (keyResult.issues.length) {
							if (def.mode === "loose") payload.value[key] = input[key];
							else payload.issues.push({
								code: "invalid_key",
								origin: "record",
								issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
								input: key,
								path: [key],
								inst
							});
							continue;
						}
						const result = def.valueType._zod.run({
							value: input[key],
							issues: []
						}, ctx);
						if (result instanceof Promise) proms.push(result.then((result) => {
							if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
							payload.value[keyResult.value] = result.value;
						}));
						else {
							if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
							payload.value[keyResult.value] = result.value;
						}
					}
				}
				if (proms.length) return Promise.all(proms).then(() => payload);
				return payload;
			};
		});
		const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
			$ZodType.init(inst, def);
			const values = getEnumValues(def.entries);
			const valuesSet = new Set(values);
			inst._zod.values = valuesSet;
			inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
			inst._zod.parse = (payload, _ctx) => {
				const input = payload.value;
				if (valuesSet.has(input)) return payload;
				payload.issues.push({
					code: "invalid_value",
					values,
					input,
					inst
				});
				return payload;
			};
		});
		const $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def) => {
			$ZodType.init(inst, def);
			if (def.values.length === 0) throw new Error("Cannot create literal schema with no valid values");
			const values = new Set(def.values);
			inst._zod.values = values;
			inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
			inst._zod.parse = (payload, _ctx) => {
				const input = payload.value;
				if (values.has(input)) return payload;
				payload.issues.push({
					code: "invalid_value",
					values: def.values,
					input,
					inst
				});
				return payload;
			};
		});
		const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
				const _out = def.transform(payload.value, payload);
				if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
					payload.value = output;
					payload.fallback = true;
					return payload;
				});
				if (_out instanceof Promise) throw new $ZodAsyncError();
				payload.value = _out;
				payload.fallback = true;
				return payload;
			};
		});
		function handleOptionalResult(result, input) {
			if (input === void 0 && (result.issues.length || result.fallback)) return {
				issues: [],
				value: void 0
			};
			return result;
		}
		const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			inst._zod.optout = "optional";
			defineLazy(inst._zod, "values", () => {
				return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
			});
			defineLazy(inst._zod, "pattern", () => {
				const pattern = def.innerType._zod.pattern;
				return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
			});
			inst._zod.parse = (payload, ctx) => {
				if (def.innerType._zod.optin === "optional") {
					const input = payload.value;
					const result = def.innerType._zod.run(payload, ctx);
					if (result instanceof Promise) return result.then((r) => handleOptionalResult(r, input));
					return handleOptionalResult(result, input);
				}
				if (payload.value === void 0) return payload;
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
			$ZodOptional.init(inst, def);
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
			inst._zod.parse = (payload, ctx) => {
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
			defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
			defineLazy(inst._zod, "pattern", () => {
				const pattern = def.innerType._zod.pattern;
				return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
			});
			defineLazy(inst._zod, "values", () => {
				return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
			});
			inst._zod.parse = (payload, ctx) => {
				if (payload.value === null) return payload;
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				if (payload.value === void 0) {
					payload.value = def.defaultValue;
					/**
					* $ZodDefault returns the default value immediately in forward direction.
					* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
					return payload;
				}
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
				return handleDefaultResult(result, def);
			};
		});
		function handleDefaultResult(payload, def) {
			if (payload.value === void 0) payload.value = def.defaultValue;
			return payload;
		}
		const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				if (payload.value === void 0) payload.value = def.defaultValue;
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "values", () => {
				const v = def.innerType._zod.values;
				return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
			});
			inst._zod.parse = (payload, ctx) => {
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
				return handleNonOptionalResult(result, inst);
			};
		});
		function handleNonOptionalResult(payload, inst) {
			if (!payload.issues.length && payload.value === void 0) payload.issues.push({
				code: "invalid_type",
				expected: "nonoptional",
				input: payload.value,
				inst
			});
			return payload;
		}
		const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then((result) => {
					payload.value = result.value;
					if (result.issues.length) {
						payload.value = def.catchValue({
							...payload,
							error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
							input: payload.value
						});
						payload.issues = [];
						payload.fallback = true;
					}
					return payload;
				});
				payload.value = result.value;
				if (result.issues.length) {
					payload.value = def.catchValue({
						...payload,
						error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
						input: payload.value
					});
					payload.issues = [];
					payload.fallback = true;
				}
				return payload;
			};
		});
		const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "values", () => def.in._zod.values);
			defineLazy(inst._zod, "optin", () => def.in._zod.optin);
			defineLazy(inst._zod, "optout", () => def.out._zod.optout);
			defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") {
					const right = def.out._zod.run(payload, ctx);
					if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
					return handlePipeResult(right, def.in, ctx);
				}
				const left = def.in._zod.run(payload, ctx);
				if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
				return handlePipeResult(left, def.out, ctx);
			};
		});
		function handlePipeResult(left, next, ctx) {
			if (left.issues.length) {
				left.aborted = true;
				return left;
			}
			return next._zod.run({
				value: left.value,
				issues: left.issues,
				fallback: left.fallback
			}, ctx);
		}
		const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
			defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then(handleReadonlyResult);
				return handleReadonlyResult(result);
			};
		});
		function handleReadonlyResult(payload) {
			payload.value = Object.freeze(payload.value);
			return payload;
		}
		const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
			$ZodCheck.init(inst, def);
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, _) => {
				return payload;
			};
			inst._zod.check = (payload) => {
				const input = payload.value;
				const r = def.fn(input);
				if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
				handleRefineResult(r, payload, input, inst);
			};
		});
		function handleRefineResult(result, payload, input, inst) {
			if (!result) {
				const _iss = {
					code: "custom",
					input,
					inst,
					path: [...inst._zod.def.path ?? []],
					continue: !inst._zod.def.abort
				};
				if (inst._zod.def.params) _iss.params = inst._zod.def.params;
				payload.issues.push(issue(_iss));
			}
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/registries.js
		var _a;
		var $ZodRegistry = class {
			constructor() {
				this._map = /* @__PURE__ */ new WeakMap();
				this._idmap = /* @__PURE__ */ new Map();
			}
			add(schema, ..._meta) {
				const meta = _meta[0];
				this._map.set(schema, meta);
				if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
				return this;
			}
			clear() {
				this._map = /* @__PURE__ */ new WeakMap();
				this._idmap = /* @__PURE__ */ new Map();
				return this;
			}
			remove(schema) {
				const meta = this._map.get(schema);
				if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
				this._map.delete(schema);
				return this;
			}
			get(schema) {
				const p = schema._zod.parent;
				if (p) {
					const pm = { ...this.get(p) ?? {} };
					delete pm.id;
					const f = {
						...pm,
						...this._map.get(schema)
					};
					return Object.keys(f).length ? f : void 0;
				}
				return this._map.get(schema);
			}
			has(schema) {
				return this._map.has(schema);
			}
		};
		function registry() {
			return new $ZodRegistry();
		}
		(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
		const globalRegistry = globalThis.__zod_globalRegistry;
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/api.js
		// @__NO_SIDE_EFFECTS__
		function _string(Class, params) {
			return new Class({
				type: "string",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _email(Class, params) {
			return new Class({
				type: "string",
				format: "email",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _guid(Class, params) {
			return new Class({
				type: "string",
				format: "guid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuid(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuidv4(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				version: "v4",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuidv6(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				version: "v6",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuidv7(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				version: "v7",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _url(Class, params) {
			return new Class({
				type: "string",
				format: "url",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _emoji(Class, params) {
			return new Class({
				type: "string",
				format: "emoji",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _nanoid(Class, params) {
			return new Class({
				type: "string",
				format: "nanoid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link _cuid2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		// @__NO_SIDE_EFFECTS__
		function _cuid(Class, params) {
			return new Class({
				type: "string",
				format: "cuid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _cuid2(Class, params) {
			return new Class({
				type: "string",
				format: "cuid2",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ulid(Class, params) {
			return new Class({
				type: "string",
				format: "ulid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _xid(Class, params) {
			return new Class({
				type: "string",
				format: "xid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ksuid(Class, params) {
			return new Class({
				type: "string",
				format: "ksuid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ipv4(Class, params) {
			return new Class({
				type: "string",
				format: "ipv4",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ipv6(Class, params) {
			return new Class({
				type: "string",
				format: "ipv6",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _cidrv4(Class, params) {
			return new Class({
				type: "string",
				format: "cidrv4",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _cidrv6(Class, params) {
			return new Class({
				type: "string",
				format: "cidrv6",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _base64(Class, params) {
			return new Class({
				type: "string",
				format: "base64",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _base64url(Class, params) {
			return new Class({
				type: "string",
				format: "base64url",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _e164(Class, params) {
			return new Class({
				type: "string",
				format: "e164",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _jwt(Class, params) {
			return new Class({
				type: "string",
				format: "jwt",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoDateTime(Class, params) {
			return new Class({
				type: "string",
				format: "datetime",
				check: "string_format",
				offset: false,
				local: false,
				precision: null,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoDate(Class, params) {
			return new Class({
				type: "string",
				format: "date",
				check: "string_format",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoTime(Class, params) {
			return new Class({
				type: "string",
				format: "time",
				check: "string_format",
				precision: null,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoDuration(Class, params) {
			return new Class({
				type: "string",
				format: "duration",
				check: "string_format",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _number(Class, params) {
			return new Class({
				type: "number",
				checks: [],
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _int(Class, params) {
			return new Class({
				type: "number",
				check: "number_format",
				abort: false,
				format: "safeint",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _boolean(Class, params) {
			return new Class({
				type: "boolean",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _unknown(Class) {
			return new Class({ type: "unknown" });
		}
		// @__NO_SIDE_EFFECTS__
		function _never(Class, params) {
			return new Class({
				type: "never",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _lt(value, params) {
			return new $ZodCheckLessThan({
				check: "less_than",
				...normalizeParams(params),
				value,
				inclusive: false
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _lte(value, params) {
			return new $ZodCheckLessThan({
				check: "less_than",
				...normalizeParams(params),
				value,
				inclusive: true
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _gt(value, params) {
			return new $ZodCheckGreaterThan({
				check: "greater_than",
				...normalizeParams(params),
				value,
				inclusive: false
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _gte(value, params) {
			return new $ZodCheckGreaterThan({
				check: "greater_than",
				...normalizeParams(params),
				value,
				inclusive: true
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _multipleOf(value, params) {
			return new $ZodCheckMultipleOf({
				check: "multiple_of",
				...normalizeParams(params),
				value
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _maxLength(maximum, params) {
			return new $ZodCheckMaxLength({
				check: "max_length",
				...normalizeParams(params),
				maximum
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _minLength(minimum, params) {
			return new $ZodCheckMinLength({
				check: "min_length",
				...normalizeParams(params),
				minimum
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _length(length, params) {
			return new $ZodCheckLengthEquals({
				check: "length_equals",
				...normalizeParams(params),
				length
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _regex(pattern, params) {
			return new $ZodCheckRegex({
				check: "string_format",
				format: "regex",
				...normalizeParams(params),
				pattern
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _lowercase(params) {
			return new $ZodCheckLowerCase({
				check: "string_format",
				format: "lowercase",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uppercase(params) {
			return new $ZodCheckUpperCase({
				check: "string_format",
				format: "uppercase",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _includes(includes, params) {
			return new $ZodCheckIncludes({
				check: "string_format",
				format: "includes",
				...normalizeParams(params),
				includes
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _startsWith(prefix, params) {
			return new $ZodCheckStartsWith({
				check: "string_format",
				format: "starts_with",
				...normalizeParams(params),
				prefix
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _endsWith(suffix, params) {
			return new $ZodCheckEndsWith({
				check: "string_format",
				format: "ends_with",
				...normalizeParams(params),
				suffix
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _overwrite(tx) {
			return new $ZodCheckOverwrite({
				check: "overwrite",
				tx
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _normalize(form) {
			return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
		}
		// @__NO_SIDE_EFFECTS__
		function _trim() {
			return /* @__PURE__ */ _overwrite((input) => input.trim());
		}
		// @__NO_SIDE_EFFECTS__
		function _toLowerCase() {
			return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
		}
		// @__NO_SIDE_EFFECTS__
		function _toUpperCase() {
			return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
		}
		// @__NO_SIDE_EFFECTS__
		function _slugify() {
			return /* @__PURE__ */ _overwrite((input) => slugify(input));
		}
		// @__NO_SIDE_EFFECTS__
		function _array(Class, element, params) {
			return new Class({
				type: "array",
				element,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _refine(Class, fn, _params) {
			return new Class({
				type: "custom",
				check: "custom",
				fn,
				...normalizeParams(_params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _superRefine(fn, params) {
			const ch = /* @__PURE__ */ _check((payload) => {
				payload.addIssue = (issue$2) => {
					if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
					else {
						const _issue = issue$2;
						if (_issue.fatal) _issue.continue = false;
						_issue.code ?? (_issue.code = "custom");
						_issue.input ?? (_issue.input = payload.value);
						_issue.inst ?? (_issue.inst = ch);
						_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
						payload.issues.push(issue(_issue));
					}
				};
				return fn(payload.value, payload);
			}, params);
			return ch;
		}
		// @__NO_SIDE_EFFECTS__
		function _check(fn, params) {
			const ch = new $ZodCheck({
				check: "custom",
				...normalizeParams(params)
			});
			ch._zod.check = fn;
			return ch;
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/to-json-schema.js
		function initializeContext(params) {
			let target = params?.target ?? "draft-2020-12";
			if (target === "draft-4") target = "draft-04";
			if (target === "draft-7") target = "draft-07";
			return {
				processors: params.processors ?? {},
				metadataRegistry: params?.metadata ?? globalRegistry,
				target,
				unrepresentable: params?.unrepresentable ?? "throw",
				override: params?.override ?? (() => {}),
				io: params?.io ?? "output",
				counter: 0,
				seen: /* @__PURE__ */ new Map(),
				cycles: params?.cycles ?? "ref",
				reused: params?.reused ?? "inline",
				external: params?.external ?? void 0
			};
		}
		function process(schema, ctx, _params = {
			path: [],
			schemaPath: []
		}) {
			var _a;
			const def = schema._zod.def;
			const seen = ctx.seen.get(schema);
			if (seen) {
				seen.count++;
				if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
				return seen.schema;
			}
			const result = {
				schema: {},
				count: 1,
				cycle: void 0,
				path: _params.path
			};
			ctx.seen.set(schema, result);
			const overrideSchema = schema._zod.toJSONSchema?.();
			if (overrideSchema) result.schema = overrideSchema;
			else {
				const params = {
					..._params,
					schemaPath: [..._params.schemaPath, schema],
					path: _params.path
				};
				if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
				else {
					const _json = result.schema;
					const processor = ctx.processors[def.type];
					if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
					processor(schema, ctx, _json, params);
				}
				const parent = schema._zod.parent;
				if (parent) {
					if (!result.ref) result.ref = parent;
					process(parent, ctx, params);
					ctx.seen.get(parent).isParent = true;
				}
			}
			const meta = ctx.metadataRegistry.get(schema);
			if (meta) Object.assign(result.schema, meta);
			if (ctx.io === "input" && isTransforming(schema)) {
				delete result.schema.examples;
				delete result.schema.default;
			}
			if (ctx.io === "input" && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
			delete result.schema._prefault;
			return ctx.seen.get(schema).schema;
		}
		function extractDefs(ctx, schema) {
			const root = ctx.seen.get(schema);
			if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
			const idToSchema = /* @__PURE__ */ new Map();
			for (const entry of ctx.seen.entries()) {
				const id = ctx.metadataRegistry.get(entry[0])?.id;
				if (id) {
					const existing = idToSchema.get(id);
					if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
					idToSchema.set(id, entry[0]);
				}
			}
			const makeURI = (entry) => {
				const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
				if (ctx.external) {
					const externalId = ctx.external.registry.get(entry[0])?.id;
					const uriGenerator = ctx.external.uri ?? ((id) => id);
					if (externalId) return { ref: uriGenerator(externalId) };
					const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
					entry[1].defId = id;
					return {
						defId: id,
						ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}`
					};
				}
				if (entry[1] === root) return { ref: "#" };
				const defUriPrefix = `#/${defsSegment}/`;
				const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
				return {
					defId,
					ref: defUriPrefix + defId
				};
			};
			const extractToDef = (entry) => {
				if (entry[1].schema.$ref) return;
				const seen = entry[1];
				const { ref, defId } = makeURI(entry);
				seen.def = { ...seen.schema };
				if (defId) seen.defId = defId;
				const schema = seen.schema;
				for (const key in schema) delete schema[key];
				schema.$ref = ref;
			};
			if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
				const seen = entry[1];
				if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
			}
			for (const entry of ctx.seen.entries()) {
				const seen = entry[1];
				if (schema === entry[0]) {
					extractToDef(entry);
					continue;
				}
				if (ctx.external) {
					const ext = ctx.external.registry.get(entry[0])?.id;
					if (schema !== entry[0] && ext) {
						extractToDef(entry);
						continue;
					}
				}
				if (ctx.metadataRegistry.get(entry[0])?.id) {
					extractToDef(entry);
					continue;
				}
				if (seen.cycle) {
					extractToDef(entry);
					continue;
				}
				if (seen.count > 1) {
					if (ctx.reused === "ref") {
						extractToDef(entry);
						continue;
					}
				}
			}
		}
		function finalize(ctx, schema) {
			const root = ctx.seen.get(schema);
			if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
			const flattenRef = (zodSchema) => {
				const seen = ctx.seen.get(zodSchema);
				if (seen.ref === null) return;
				const schema = seen.def ?? seen.schema;
				const _cached = { ...schema };
				const ref = seen.ref;
				seen.ref = null;
				if (ref) {
					flattenRef(ref);
					const refSeen = ctx.seen.get(ref);
					const refSchema = refSeen.schema;
					if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
						schema.allOf = schema.allOf ?? [];
						schema.allOf.push(refSchema);
					} else Object.assign(schema, refSchema);
					Object.assign(schema, _cached);
					if (zodSchema._zod.parent === ref) for (const key in schema) {
						if (key === "$ref" || key === "allOf") continue;
						if (!(key in _cached)) delete schema[key];
					}
					if (refSchema.$ref && refSeen.def) for (const key in schema) {
						if (key === "$ref" || key === "allOf") continue;
						if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
					}
				}
				const parent = zodSchema._zod.parent;
				if (parent && parent !== ref) {
					flattenRef(parent);
					const parentSeen = ctx.seen.get(parent);
					if (parentSeen?.schema.$ref) {
						schema.$ref = parentSeen.schema.$ref;
						if (parentSeen.def) for (const key in schema) {
							if (key === "$ref" || key === "allOf") continue;
							if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
						}
					}
				}
				ctx.override({
					zodSchema,
					jsonSchema: schema,
					path: seen.path ?? []
				});
			};
			for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
			const result = {};
			if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
			else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
			else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
			else if (ctx.target === "openapi-3.0") {}
			if (ctx.external?.uri) {
				const id = ctx.external.registry.get(schema)?.id;
				if (!id) throw new Error("Schema is missing an `id` property");
				result.$id = ctx.external.uri(id);
			}
			Object.assign(result, root.def ?? root.schema);
			const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
			if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
			const defs = ctx.external?.defs ?? {};
			for (const entry of ctx.seen.entries()) {
				const seen = entry[1];
				if (seen.def && seen.defId) {
					if (seen.def.id === seen.defId) delete seen.def.id;
					defs[seen.defId] = seen.def;
				}
			}
			if (ctx.external) {} else if (Object.keys(defs).length > 0) {
				if (ctx.target === "draft-2020-12") result.$defs = defs;
				else result.definitions = defs;
			}
			try {
				const finalized = JSON.parse(JSON.stringify(result));
				Object.defineProperty(finalized, "~standard", {
					value: {
						...schema["~standard"],
						jsonSchema: {
							input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
							output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
						}
					},
					enumerable: false,
					writable: false
				});
				return finalized;
			} catch (_err) {
				throw new Error("Error converting schema to JSON.");
			}
		}
		function isTransforming(_schema, _ctx) {
			const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
			if (ctx.seen.has(_schema)) return false;
			ctx.seen.add(_schema);
			const def = _schema._zod.def;
			if (def.type === "transform") return true;
			if (def.type === "array") return isTransforming(def.element, ctx);
			if (def.type === "set") return isTransforming(def.valueType, ctx);
			if (def.type === "lazy") return isTransforming(def.getter(), ctx);
			if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") return isTransforming(def.innerType, ctx);
			if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
			if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
			if (def.type === "pipe") {
				if (_schema._zod.traits.has("$ZodCodec")) return true;
				return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
			}
			if (def.type === "object") {
				for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
				return false;
			}
			if (def.type === "union") {
				for (const option of def.options) if (isTransforming(option, ctx)) return true;
				return false;
			}
			if (def.type === "tuple") {
				for (const item of def.items) if (isTransforming(item, ctx)) return true;
				if (def.rest && isTransforming(def.rest, ctx)) return true;
				return false;
			}
			return false;
		}
		/**
		* Creates a toJSONSchema method for a schema instance.
		* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
		*/
		const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
			const ctx = initializeContext({
				...params,
				processors
			});
			process(schema, ctx);
			extractDefs(ctx, schema);
			return finalize(ctx, schema);
		};
		const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
			const { libraryOptions, target } = params ?? {};
			const ctx = initializeContext({
				...libraryOptions ?? {},
				target,
				io,
				processors
			});
			process(schema, ctx);
			extractDefs(ctx, schema);
			return finalize(ctx, schema);
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/json-schema-processors.js
		const formatMap = {
			guid: "uuid",
			url: "uri",
			datetime: "date-time",
			json_string: "json-string",
			regex: ""
		};
		const stringProcessor = (schema, ctx, _json, _params) => {
			const json = _json;
			json.type = "string";
			const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
			if (typeof minimum === "number") json.minLength = minimum;
			if (typeof maximum === "number") json.maxLength = maximum;
			if (format) {
				json.format = formatMap[format] ?? format;
				if (json.format === "") delete json.format;
				if (format === "time") delete json.format;
			}
			if (contentEncoding) json.contentEncoding = contentEncoding;
			if (patterns && patterns.size > 0) {
				const regexes = [...patterns];
				if (regexes.length === 1) json.pattern = regexes[0].source;
				else if (regexes.length > 1) json.allOf = [...regexes.map((regex) => ({
					...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
					pattern: regex.source
				}))];
			}
		};
		const numberProcessor = (schema, ctx, _json, _params) => {
			const json = _json;
			const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
			if (typeof format === "string" && format.includes("int")) json.type = "integer";
			else json.type = "number";
			const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
			const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
			const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
			if (exMin) {
				if (legacy) {
					json.minimum = exclusiveMinimum;
					json.exclusiveMinimum = true;
				} else json.exclusiveMinimum = exclusiveMinimum;
			} else if (typeof minimum === "number") json.minimum = minimum;
			if (exMax) {
				if (legacy) {
					json.maximum = exclusiveMaximum;
					json.exclusiveMaximum = true;
				} else json.exclusiveMaximum = exclusiveMaximum;
			} else if (typeof maximum === "number") json.maximum = maximum;
			if (typeof multipleOf === "number") json.multipleOf = multipleOf;
		};
		const booleanProcessor = (_schema, _ctx, json, _params) => {
			json.type = "boolean";
		};
		const neverProcessor = (_schema, _ctx, json, _params) => {
			json.not = {};
		};
		const enumProcessor = (schema, _ctx, json, _params) => {
			const def = schema._zod.def;
			const values = getEnumValues(def.entries);
			if (values.every((v) => typeof v === "number")) json.type = "number";
			if (values.every((v) => typeof v === "string")) json.type = "string";
			json.enum = values;
		};
		const literalProcessor = (schema, ctx, json, _params) => {
			const def = schema._zod.def;
			const vals = [];
			for (const val of def.values) if (val === void 0) {
				if (ctx.unrepresentable === "throw") throw new Error("Literal `undefined` cannot be represented in JSON Schema");
			} else if (typeof val === "bigint") {
				if (ctx.unrepresentable === "throw") throw new Error("BigInt literals cannot be represented in JSON Schema");
				else vals.push(Number(val));
			} else vals.push(val);
			if (vals.length === 0) {} else if (vals.length === 1) {
				const val = vals[0];
				json.type = val === null ? "null" : typeof val;
				if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
				else json.const = val;
			} else {
				if (vals.every((v) => typeof v === "number")) json.type = "number";
				if (vals.every((v) => typeof v === "string")) json.type = "string";
				if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
				if (vals.every((v) => v === null)) json.type = "null";
				json.enum = vals;
			}
		};
		const customProcessor = (_schema, ctx, _json, _params) => {
			if (ctx.unrepresentable === "throw") throw new Error("Custom types cannot be represented in JSON Schema");
		};
		const transformProcessor = (_schema, ctx, _json, _params) => {
			if (ctx.unrepresentable === "throw") throw new Error("Transforms cannot be represented in JSON Schema");
		};
		const arrayProcessor = (schema, ctx, _json, params) => {
			const json = _json;
			const def = schema._zod.def;
			const { minimum, maximum } = schema._zod.bag;
			if (typeof minimum === "number") json.minItems = minimum;
			if (typeof maximum === "number") json.maxItems = maximum;
			json.type = "array";
			json.items = process(def.element, ctx, {
				...params,
				path: [...params.path, "items"]
			});
		};
		const objectProcessor = (schema, ctx, _json, params) => {
			const json = _json;
			const def = schema._zod.def;
			json.type = "object";
			json.properties = {};
			const shape = def.shape;
			for (const key in shape) json.properties[key] = process(shape[key], ctx, {
				...params,
				path: [
					...params.path,
					"properties",
					key
				]
			});
			const allKeys = new Set(Object.keys(shape));
			const requiredKeys = new Set([...allKeys].filter((key) => {
				const v = def.shape[key]._zod;
				if (ctx.io === "input") return v.optin === void 0;
				else return v.optout === void 0;
			}));
			if (requiredKeys.size > 0) json.required = Array.from(requiredKeys);
			if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
			else if (!def.catchall) {
				if (ctx.io === "output") json.additionalProperties = false;
			} else if (def.catchall) json.additionalProperties = process(def.catchall, ctx, {
				...params,
				path: [...params.path, "additionalProperties"]
			});
		};
		const unionProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			const isExclusive = def.inclusive === false;
			const options = def.options.map((x, i) => process(x, ctx, {
				...params,
				path: [
					...params.path,
					isExclusive ? "oneOf" : "anyOf",
					i
				]
			}));
			if (isExclusive) json.oneOf = options;
			else json.anyOf = options;
		};
		const intersectionProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			const a = process(def.left, ctx, {
				...params,
				path: [
					...params.path,
					"allOf",
					0
				]
			});
			const b = process(def.right, ctx, {
				...params,
				path: [
					...params.path,
					"allOf",
					1
				]
			});
			const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
			json.allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
		};
		const recordProcessor = (schema, ctx, _json, params) => {
			const json = _json;
			const def = schema._zod.def;
			json.type = "object";
			const keyType = def.keyType;
			const patterns = keyType._zod.bag?.patterns;
			if (def.mode === "loose" && patterns && patterns.size > 0) {
				const valueSchema = process(def.valueType, ctx, {
					...params,
					path: [
						...params.path,
						"patternProperties",
						"*"
					]
				});
				json.patternProperties = {};
				for (const pattern of patterns) json.patternProperties[pattern.source] = valueSchema;
			} else {
				if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") json.propertyNames = process(def.keyType, ctx, {
					...params,
					path: [...params.path, "propertyNames"]
				});
				json.additionalProperties = process(def.valueType, ctx, {
					...params,
					path: [...params.path, "additionalProperties"]
				});
			}
			const keyValues = keyType._zod.values;
			if (keyValues) {
				const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
				if (validKeyValues.length > 0) json.required = validKeyValues;
			}
		};
		const nullableProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			const inner = process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			if (ctx.target === "openapi-3.0") {
				seen.ref = def.innerType;
				json.nullable = true;
			} else json.anyOf = [inner, { type: "null" }];
		};
		const nonoptionalProcessor = (schema, ctx, _json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
		};
		const defaultProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			json.default = JSON.parse(JSON.stringify(def.defaultValue));
		};
		const prefaultProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			if (ctx.io === "input") json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
		};
		const catchProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			let catchValue;
			try {
				catchValue = def.catchValue(void 0);
			} catch {
				throw new Error("Dynamic catch values are not supported in JSON Schema");
			}
			json.default = catchValue;
		};
		const pipeProcessor = (schema, ctx, _json, params) => {
			const def = schema._zod.def;
			const inIsTransform = def.in._zod.traits.has("$ZodTransform");
			const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
			process(innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = innerType;
		};
		const readonlyProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			json.readOnly = true;
		};
		const optionalProcessor = (schema, ctx, _json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/iso.js
		const ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
			$ZodISODateTime.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function datetime(params) {
			return /* @__PURE__ */ _isoDateTime(ZodISODateTime, params);
		}
		const ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
			$ZodISODate.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function date(params) {
			return /* @__PURE__ */ _isoDate(ZodISODate, params);
		}
		const ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
			$ZodISOTime.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function time(params) {
			return /* @__PURE__ */ _isoTime(ZodISOTime, params);
		}
		const ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
			$ZodISODuration.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function duration(params) {
			return /* @__PURE__ */ _isoDuration(ZodISODuration, params);
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/errors.js
		const initializer = (inst, issues) => {
			$ZodError.init(inst, issues);
			inst.name = "ZodError";
			Object.defineProperties(inst, {
				format: { value: (mapper) => formatError(inst, mapper) },
				flatten: { value: (mapper) => flattenError(inst, mapper) },
				addIssue: { value: (issue) => {
					inst.issues.push(issue);
					inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
				} },
				addIssues: { value: (issues) => {
					inst.issues.push(...issues);
					inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
				} },
				isEmpty: { get() {
					return inst.issues.length === 0;
				} }
			});
		};
		const ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, { Parent: Error });
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/parse.js
		const parse = /* @__PURE__ */ _parse(ZodRealError);
		const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
		const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
		const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
		const encode = /* @__PURE__ */ _encode(ZodRealError);
		const decode = /* @__PURE__ */ _decode(ZodRealError);
		const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
		const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
		const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
		const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
		const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
		const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/schemas.js
		const _installedGroups = /* @__PURE__ */ new WeakMap();
		function _installLazyMethods(inst, group, methods) {
			const proto = Object.getPrototypeOf(inst);
			let installed = _installedGroups.get(proto);
			if (!installed) {
				installed = /* @__PURE__ */ new Set();
				_installedGroups.set(proto, installed);
			}
			if (installed.has(group)) return;
			installed.add(group);
			for (const key in methods) {
				const fn = methods[key];
				Object.defineProperty(proto, key, {
					configurable: true,
					enumerable: false,
					get() {
						const bound = fn.bind(this);
						Object.defineProperty(this, key, {
							configurable: true,
							writable: true,
							enumerable: true,
							value: bound
						});
						return bound;
					},
					set(v) {
						Object.defineProperty(this, key, {
							configurable: true,
							writable: true,
							enumerable: true,
							value: v
						});
					}
				});
			}
		}
		const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
			$ZodType.init(inst, def);
			Object.assign(inst["~standard"], { jsonSchema: {
				input: createStandardJSONSchemaMethod(inst, "input"),
				output: createStandardJSONSchemaMethod(inst, "output")
			} });
			inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
			inst.def = def;
			inst.type = def.type;
			Object.defineProperty(inst, "_def", { value: def });
			inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
			inst.safeParse = (data, params) => safeParse(inst, data, params);
			inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
			inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
			inst.spa = inst.safeParseAsync;
			inst.encode = (data, params) => encode(inst, data, params);
			inst.decode = (data, params) => decode(inst, data, params);
			inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
			inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
			inst.safeEncode = (data, params) => safeEncode(inst, data, params);
			inst.safeDecode = (data, params) => safeDecode(inst, data, params);
			inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
			inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
			_installLazyMethods(inst, "ZodType", {
				check(...chks) {
					const def = this.def;
					return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
						check: ch,
						def: { check: "custom" },
						onattach: []
					} } : ch)] }), { parent: true });
				},
				with(...chks) {
					return this.check(...chks);
				},
				clone(def, params) {
					return clone(this, def, params);
				},
				brand() {
					return this;
				},
				register(reg, meta) {
					reg.add(this, meta);
					return this;
				},
				refine(check, params) {
					return this.check(refine(check, params));
				},
				superRefine(refinement, params) {
					return this.check(superRefine(refinement, params));
				},
				overwrite(fn) {
					return this.check(/* @__PURE__ */ _overwrite(fn));
				},
				optional() {
					return optional(this);
				},
				exactOptional() {
					return exactOptional(this);
				},
				nullable() {
					return nullable(this);
				},
				nullish() {
					return optional(nullable(this));
				},
				nonoptional(params) {
					return nonoptional(this, params);
				},
				array() {
					return array(this);
				},
				or(arg) {
					return union([this, arg]);
				},
				and(arg) {
					return intersection(this, arg);
				},
				transform(tx) {
					return pipe(this, transform(tx));
				},
				default(d) {
					return _default(this, d);
				},
				prefault(d) {
					return prefault(this, d);
				},
				catch(params) {
					return _catch(this, params);
				},
				pipe(target) {
					return pipe(this, target);
				},
				readonly() {
					return readonly(this);
				},
				describe(description) {
					const cl = this.clone();
					globalRegistry.add(cl, { description });
					return cl;
				},
				meta(...args) {
					if (args.length === 0) return globalRegistry.get(this);
					const cl = this.clone();
					globalRegistry.add(cl, args[0]);
					return cl;
				},
				isOptional() {
					return this.safeParse(void 0).success;
				},
				isNullable() {
					return this.safeParse(null).success;
				},
				apply(fn) {
					return fn(this);
				}
			});
			Object.defineProperty(inst, "description", {
				get() {
					return globalRegistry.get(inst)?.description;
				},
				configurable: true
			});
			return inst;
		});
		/** @internal */
		const _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
			$ZodString.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
			const bag = inst._zod.bag;
			inst.format = bag.format ?? null;
			inst.minLength = bag.minimum ?? null;
			inst.maxLength = bag.maximum ?? null;
			_installLazyMethods(inst, "_ZodString", {
				regex(...args) {
					return this.check(/* @__PURE__ */ _regex(...args));
				},
				includes(...args) {
					return this.check(/* @__PURE__ */ _includes(...args));
				},
				startsWith(...args) {
					return this.check(/* @__PURE__ */ _startsWith(...args));
				},
				endsWith(...args) {
					return this.check(/* @__PURE__ */ _endsWith(...args));
				},
				min(...args) {
					return this.check(/* @__PURE__ */ _minLength(...args));
				},
				max(...args) {
					return this.check(/* @__PURE__ */ _maxLength(...args));
				},
				length(...args) {
					return this.check(/* @__PURE__ */ _length(...args));
				},
				nonempty(...args) {
					return this.check(/* @__PURE__ */ _minLength(1, ...args));
				},
				lowercase(params) {
					return this.check(/* @__PURE__ */ _lowercase(params));
				},
				uppercase(params) {
					return this.check(/* @__PURE__ */ _uppercase(params));
				},
				trim() {
					return this.check(/* @__PURE__ */ _trim());
				},
				normalize(...args) {
					return this.check(/* @__PURE__ */ _normalize(...args));
				},
				toLowerCase() {
					return this.check(/* @__PURE__ */ _toLowerCase());
				},
				toUpperCase() {
					return this.check(/* @__PURE__ */ _toUpperCase());
				},
				slugify() {
					return this.check(/* @__PURE__ */ _slugify());
				}
			});
		});
		const ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
			$ZodString.init(inst, def);
			_ZodString.init(inst, def);
			inst.email = (params) => inst.check(/* @__PURE__ */ _email(ZodEmail, params));
			inst.url = (params) => inst.check(/* @__PURE__ */ _url(ZodURL, params));
			inst.jwt = (params) => inst.check(/* @__PURE__ */ _jwt(ZodJWT, params));
			inst.emoji = (params) => inst.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
			inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
			inst.uuid = (params) => inst.check(/* @__PURE__ */ _uuid(ZodUUID, params));
			inst.uuidv4 = (params) => inst.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
			inst.uuidv6 = (params) => inst.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
			inst.uuidv7 = (params) => inst.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
			inst.nanoid = (params) => inst.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
			inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
			inst.cuid = (params) => inst.check(/* @__PURE__ */ _cuid(ZodCUID, params));
			inst.cuid2 = (params) => inst.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
			inst.ulid = (params) => inst.check(/* @__PURE__ */ _ulid(ZodULID, params));
			inst.base64 = (params) => inst.check(/* @__PURE__ */ _base64(ZodBase64, params));
			inst.base64url = (params) => inst.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
			inst.xid = (params) => inst.check(/* @__PURE__ */ _xid(ZodXID, params));
			inst.ksuid = (params) => inst.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
			inst.ipv4 = (params) => inst.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
			inst.ipv6 = (params) => inst.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
			inst.cidrv4 = (params) => inst.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
			inst.cidrv6 = (params) => inst.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
			inst.e164 = (params) => inst.check(/* @__PURE__ */ _e164(ZodE164, params));
			inst.datetime = (params) => inst.check(datetime(params));
			inst.date = (params) => inst.check(date(params));
			inst.time = (params) => inst.check(time(params));
			inst.duration = (params) => inst.check(duration(params));
		});
		function string(params) {
			return /* @__PURE__ */ _string(ZodString, params);
		}
		const ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
			$ZodStringFormat.init(inst, def);
			_ZodString.init(inst, def);
		});
		const ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
			$ZodEmail.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
			$ZodGUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
			$ZodUUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
			$ZodURL.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
			$ZodEmoji.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
			$ZodNanoID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link ZodCUID2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		const ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
			$ZodCUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
			$ZodCUID2.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
			$ZodULID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
			$ZodXID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
			$ZodKSUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
			$ZodIPv4.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
			$ZodIPv6.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
			$ZodCIDRv4.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
			$ZodCIDRv6.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
			$ZodBase64.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
			$ZodBase64URL.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
			$ZodE164.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
			$ZodJWT.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
			$ZodNumber.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
			_installLazyMethods(inst, "ZodNumber", {
				gt(value, params) {
					return this.check(/* @__PURE__ */ _gt(value, params));
				},
				gte(value, params) {
					return this.check(/* @__PURE__ */ _gte(value, params));
				},
				min(value, params) {
					return this.check(/* @__PURE__ */ _gte(value, params));
				},
				lt(value, params) {
					return this.check(/* @__PURE__ */ _lt(value, params));
				},
				lte(value, params) {
					return this.check(/* @__PURE__ */ _lte(value, params));
				},
				max(value, params) {
					return this.check(/* @__PURE__ */ _lte(value, params));
				},
				int(params) {
					return this.check(int(params));
				},
				safe(params) {
					return this.check(int(params));
				},
				positive(params) {
					return this.check(/* @__PURE__ */ _gt(0, params));
				},
				nonnegative(params) {
					return this.check(/* @__PURE__ */ _gte(0, params));
				},
				negative(params) {
					return this.check(/* @__PURE__ */ _lt(0, params));
				},
				nonpositive(params) {
					return this.check(/* @__PURE__ */ _lte(0, params));
				},
				multipleOf(value, params) {
					return this.check(/* @__PURE__ */ _multipleOf(value, params));
				},
				step(value, params) {
					return this.check(/* @__PURE__ */ _multipleOf(value, params));
				},
				finite() {
					return this;
				}
			});
			const bag = inst._zod.bag;
			inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
			inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
			inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? .5);
			inst.isFinite = true;
			inst.format = bag.format ?? null;
		});
		function number(params) {
			return /* @__PURE__ */ _number(ZodNumber, params);
		}
		const ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
			$ZodNumberFormat.init(inst, def);
			ZodNumber.init(inst, def);
		});
		function int(params) {
			return /* @__PURE__ */ _int(ZodNumberFormat, params);
		}
		const ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def) => {
			$ZodBoolean.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
		});
		function boolean(params) {
			return /* @__PURE__ */ _boolean(ZodBoolean, params);
		}
		const ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
			$ZodUnknown.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => void 0;
		});
		function unknown() {
			return /* @__PURE__ */ _unknown(ZodUnknown);
		}
		const ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
			$ZodNever.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
		});
		function never(params) {
			return /* @__PURE__ */ _never(ZodNever, params);
		}
		const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
			$ZodArray.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
			inst.element = def.element;
			_installLazyMethods(inst, "ZodArray", {
				min(n, params) {
					return this.check(/* @__PURE__ */ _minLength(n, params));
				},
				nonempty(params) {
					return this.check(/* @__PURE__ */ _minLength(1, params));
				},
				max(n, params) {
					return this.check(/* @__PURE__ */ _maxLength(n, params));
				},
				length(n, params) {
					return this.check(/* @__PURE__ */ _length(n, params));
				},
				unwrap() {
					return this.element;
				}
			});
		});
		function array(element, params) {
			return /* @__PURE__ */ _array(ZodArray, element, params);
		}
		const ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
			$ZodObjectJIT.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
			defineLazy(inst, "shape", () => {
				return def.shape;
			});
			_installLazyMethods(inst, "ZodObject", {
				keyof() {
					return _enum(Object.keys(this._zod.def.shape));
				},
				catchall(catchall) {
					return this.clone({
						...this._zod.def,
						catchall
					});
				},
				passthrough() {
					return this.clone({
						...this._zod.def,
						catchall: unknown()
					});
				},
				loose() {
					return this.clone({
						...this._zod.def,
						catchall: unknown()
					});
				},
				strict() {
					return this.clone({
						...this._zod.def,
						catchall: never()
					});
				},
				strip() {
					return this.clone({
						...this._zod.def,
						catchall: void 0
					});
				},
				extend(incoming) {
					return extend(this, incoming);
				},
				safeExtend(incoming) {
					return safeExtend(this, incoming);
				},
				merge(other) {
					return merge(this, other);
				},
				pick(mask) {
					return pick(this, mask);
				},
				omit(mask) {
					return omit(this, mask);
				},
				partial(...args) {
					return partial(ZodOptional, this, args[0]);
				},
				required(...args) {
					return required(ZodNonOptional, this, args[0]);
				}
			});
		});
		function strictObject(shape, params) {
			return new ZodObject({
				type: "object",
				shape,
				catchall: never(),
				...normalizeParams(params)
			});
		}
		const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
			$ZodUnion.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
			inst.options = def.options;
		});
		function union(options, params) {
			return new ZodUnion({
				type: "union",
				options,
				...normalizeParams(params)
			});
		}
		const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
			$ZodIntersection.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
		});
		function intersection(left, right) {
			return new ZodIntersection({
				type: "intersection",
				left,
				right
			});
		}
		const ZodRecord = /*@__PURE__*/ $constructor("ZodRecord", (inst, def) => {
			$ZodRecord.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
			inst.keyType = def.keyType;
			inst.valueType = def.valueType;
		});
		function record(keyType, valueType, params) {
			if (!valueType || !valueType._zod) return new ZodRecord({
				type: "record",
				keyType: string(),
				valueType: keyType,
				...normalizeParams(valueType)
			});
			return new ZodRecord({
				type: "record",
				keyType,
				valueType,
				...normalizeParams(params)
			});
		}
		const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
			$ZodEnum.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
			inst.enum = def.entries;
			inst.options = Object.values(def.entries);
			const keys = new Set(Object.keys(def.entries));
			inst.extract = (values, params) => {
				const newEntries = {};
				for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
				else throw new Error(`Key ${value} not found in enum`);
				return new ZodEnum({
					...def,
					checks: [],
					...normalizeParams(params),
					entries: newEntries
				});
			};
			inst.exclude = (values, params) => {
				const newEntries = { ...def.entries };
				for (const value of values) if (keys.has(value)) delete newEntries[value];
				else throw new Error(`Key ${value} not found in enum`);
				return new ZodEnum({
					...def,
					checks: [],
					...normalizeParams(params),
					entries: newEntries
				});
			};
		});
		function _enum(values, params) {
			const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
			return new ZodEnum({
				type: "enum",
				entries,
				...normalizeParams(params)
			});
		}
		const ZodLiteral = /*@__PURE__*/ $constructor("ZodLiteral", (inst, def) => {
			$ZodLiteral.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
			inst.values = new Set(def.values);
			Object.defineProperty(inst, "value", { get() {
				if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
				return def.values[0];
			} });
		});
		function literal(value, params) {
			return new ZodLiteral({
				type: "literal",
				values: Array.isArray(value) ? value : [value],
				...normalizeParams(params)
			});
		}
		const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
			$ZodTransform.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
			inst._zod.parse = (payload, _ctx) => {
				if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
				payload.addIssue = (issue$1) => {
					if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
					else {
						const _issue = issue$1;
						if (_issue.fatal) _issue.continue = false;
						_issue.code ?? (_issue.code = "custom");
						_issue.input ?? (_issue.input = payload.value);
						_issue.inst ?? (_issue.inst = inst);
						payload.issues.push(issue(_issue));
					}
				};
				const output = def.transform(payload.value, payload);
				if (output instanceof Promise) return output.then((output) => {
					payload.value = output;
					payload.fallback = true;
					return payload;
				});
				payload.value = output;
				payload.fallback = true;
				return payload;
			};
		});
		function transform(fn) {
			return new ZodTransform({
				type: "transform",
				transform: fn
			});
		}
		const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
			$ZodOptional.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function optional(innerType) {
			return new ZodOptional({
				type: "optional",
				innerType
			});
		}
		const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
			$ZodExactOptional.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function exactOptional(innerType) {
			return new ZodExactOptional({
				type: "optional",
				innerType
			});
		}
		const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
			$ZodNullable.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function nullable(innerType) {
			return new ZodNullable({
				type: "nullable",
				innerType
			});
		}
		const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
			$ZodDefault.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
			inst.removeDefault = inst.unwrap;
		});
		function _default(innerType, defaultValue) {
			return new ZodDefault({
				type: "default",
				innerType,
				get defaultValue() {
					return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
				}
			});
		}
		const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
			$ZodPrefault.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function prefault(innerType, defaultValue) {
			return new ZodPrefault({
				type: "prefault",
				innerType,
				get defaultValue() {
					return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
				}
			});
		}
		const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
			$ZodNonOptional.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function nonoptional(innerType, params) {
			return new ZodNonOptional({
				type: "nonoptional",
				innerType,
				...normalizeParams(params)
			});
		}
		const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
			$ZodCatch.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
			inst.removeCatch = inst.unwrap;
		});
		function _catch(innerType, catchValue) {
			return new ZodCatch({
				type: "catch",
				innerType,
				catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
			});
		}
		const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
			$ZodPipe.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
			inst.in = def.in;
			inst.out = def.out;
		});
		function pipe(in_, out) {
			return new ZodPipe({
				type: "pipe",
				in: in_,
				out
			});
		}
		const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
			$ZodReadonly.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function readonly(innerType) {
			return new ZodReadonly({
				type: "readonly",
				innerType
			});
		}
		const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
			$ZodCustom.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
		});
		function refine(fn, _params = {}) {
			return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
		}
		function superRefine(fn, params) {
			return /* @__PURE__ */ _superRefine(fn, params);
		}
		//#endregion
		//#region src/remote-contract.ts
		const networkStatusSchema = strictObject({
			phase: union([
				literal("starting"),
				literal("online"),
				literal("error")
			]),
			peerId: string().optional(),
			addresses: array(string()).readonly(),
			connectedPeers: number().int().nonnegative(),
			discoveredPeers: number().int().nonnegative(),
			bootstrapConfigured: number().int().nonnegative(),
			relayAddresses: number().int().nonnegative(),
			error: string().optional()
		});
		const inviteInfoSchema = strictObject({
			code: string(),
			peerId: string(),
			addresses: array(string()).readonly(),
			expiresAt: number().int().positive()
		});
		const connectResultSchema = strictObject({
			connected: boolean(),
			peerId: string()
		});
		const inviteCodeSchema = string().min(1).max(16384);
		const roomProfileSchema = strictObject({
			name: string().min(1).max(48),
			avatarUrl: string().max(12288).optional(),
			avatarCid: string().regex(/^sha256:[a-f0-9]{64}$/).optional(),
			lastCompletedSession: string().max(120).optional()
		});
		const postRoomMessageInputSchema = strictObject({ body: string().min(1).max(400) });
		const hallParticipantSchema = strictObject({
			peerId: string(),
			profile: roomProfileSchema,
			joinedAt: number().int().positive()
		});
		const hallSeatSchema = strictObject({
			participant: hallParticipantSchema,
			seatedAt: number().int().positive(),
			lastSpokeAt: number().int().positive().optional(),
			leaseExpiresAt: number().int().positive(),
			idleExpiresAt: number().int().positive()
		});
		const roomMessageSchema = strictObject({
			id: string(),
			origin: string(),
			sequence: number().int().positive(),
			sentAt: number().int().positive(),
			body: string()
		});
		const hallCheckpointSchema = strictObject({
			epoch: number().int().nonnegative(),
			stewardPeerId: string(),
			stateHash: string().regex(/^[a-f0-9]{64}$/),
			witnesses: array(string()).max(8).readonly(),
			issuedAt: number().int().positive()
		});
		const roomSnapshotSchema = strictObject({
			roomId: literal("hall"),
			seats: array(hallSeatSchema.nullable()).length(8).readonly(),
			queue: array(hallParticipantSchema).max(24).readonly(),
			queueCount: number().int().min(0).max(500),
			participantCount: number().int().min(0).max(500),
			capacity: literal(500),
			localQueuePosition: number().int().min(1).max(492).optional(),
			messages: array(roomMessageSchema).max(50).readonly(),
			profiles: record(string(), roomProfileSchema).readonly(),
			avatars: record(string(), string().max(12288)).readonly(),
			cursor: number().int().nonnegative(),
			checkpoint: hallCheckpointSchema.optional(),
			updatedAt: number().int().nonnegative()
		});
		const roomDeltaSchema = roomSnapshotSchema.extend({ reset: boolean() });
		const cursorSchema = number().int().min(-1);
		const eventIdSchema = string().min(16).max(80);
		const evidenceBundleSchema = strictObject({
			format: literal("dsh-carbon-club-evidence/v1"),
			exportedAt: number().int().positive(),
			event: unknown()
		});
		//#endregion
		//#region src/typert.remote-client.ts
		const TYPERT_REMOTE = {
			package: "dsh-human-buffer",
			descriptors: [
				{
					id: "dsh-human-buffer#carbonClub/status",
					service: "carbonClub",
					namespace: "carbonClub",
					method: "status",
					invocation: { kind: "direct" },
					parameters: [],
					result: {
						mode: "strict",
						typeSymbol: "dsh-human-buffer#NetworkStatus",
						schema: networkStatusSchema
					},
					sourceLocation: {
						file: "src/index.ts",
						line: 25,
						column: 3
					}
				},
				{
					id: "dsh-human-buffer#carbonClub/createInvite",
					service: "carbonClub",
					namespace: "carbonClub",
					method: "createInvite",
					invocation: { kind: "direct" },
					parameters: [],
					result: {
						mode: "strict",
						typeSymbol: "dsh-human-buffer#InviteInfo",
						schema: inviteInfoSchema
					},
					sourceLocation: {
						file: "src/index.ts",
						line: 37,
						column: 3
					}
				},
				{
					id: "dsh-human-buffer#carbonClub/connect",
					service: "carbonClub",
					namespace: "carbonClub",
					method: "connect",
					invocation: { kind: "direct" },
					parameters: [{
						name: "code",
						wire: "code",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "string",
							schema: inviteCodeSchema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "dsh-human-buffer#ConnectResult",
						schema: connectResultSchema
					},
					sourceLocation: {
						file: "src/index.ts",
						line: 45,
						column: 3
					}
				},
				{
					id: "dsh-human-buffer#carbonClub/roomSnapshot",
					service: "carbonClub",
					namespace: "carbonClub",
					method: "roomSnapshot",
					invocation: { kind: "direct" },
					parameters: [],
					result: {
						mode: "strict",
						typeSymbol: "dsh-human-buffer#RoomSnapshot",
						schema: roomSnapshotSchema
					}
				},
				{
					id: "dsh-human-buffer#carbonClub/roomDelta",
					service: "carbonClub",
					namespace: "carbonClub",
					method: "roomDelta",
					invocation: { kind: "direct" },
					parameters: [{
						name: "cursor",
						wire: "cursor",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "number",
							schema: cursorSchema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "dsh-human-buffer#RoomDelta",
						schema: roomDeltaSchema
					}
				},
				{
					id: "dsh-human-buffer#carbonClub/evidence",
					service: "carbonClub",
					namespace: "carbonClub",
					method: "evidence",
					invocation: { kind: "direct" },
					parameters: [{
						name: "eventId",
						wire: "eventId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "string",
							schema: eventIdSchema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "dsh-human-buffer#EvidenceBundle",
						schema: evidenceBundleSchema
					}
				},
				{
					id: "dsh-human-buffer#carbonClub/joinHall",
					service: "carbonClub",
					namespace: "carbonClub",
					method: "joinHall",
					invocation: { kind: "direct" },
					parameters: [{
						name: "profile",
						wire: "profile",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "dsh-human-buffer#RoomProfile",
							schema: roomProfileSchema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "dsh-human-buffer#RoomSnapshot",
						schema: roomSnapshotSchema
					}
				},
				{
					id: "dsh-human-buffer#carbonClub/leaveHall",
					service: "carbonClub",
					namespace: "carbonClub",
					method: "leaveHall",
					invocation: { kind: "direct" },
					parameters: [],
					result: {
						mode: "strict",
						typeSymbol: "dsh-human-buffer#RoomSnapshot",
						schema: roomSnapshotSchema
					}
				},
				{
					id: "dsh-human-buffer#carbonClub/postRoomMessage",
					service: "carbonClub",
					namespace: "carbonClub",
					method: "postRoomMessage",
					invocation: { kind: "direct" },
					parameters: [{
						name: "input",
						wire: "input",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "dsh-human-buffer#PostRoomMessageInput",
							schema: postRoomMessageInputSchema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "dsh-human-buffer#RoomMessage",
						schema: roomMessageSchema
					}
				}
			]
		};
		//#endregion
		//#region src/client/hall-machine.ts
		const HALL_RULES = {
			seatCount: 8,
			idleMs: 12e4,
			warningMs: 3e4,
			offerMs: 3e4,
			maxLeaseMs: 3e5,
			cooldownMs: 6e5,
			slowModeMs: 8e3,
			maxMessageLength: 400,
			maxConsecutiveMessages: 2
		};
		//#endregion
		//#region src/client/i18n.ts
		const COPY = {
			zh: {
				clubName: "碳基会所",
				openClub: "打开碳基会所",
				collapseClub: "收起碳基会所",
				switchLanguage: "Switch to English",
				roomsLabel: "房间",
				agentRunning: "Agent 正在工作 · 人类可以喘口气",
				agentIdle: "Agent 当前空闲 · 缓冲区仍可围观",
				localIdentity: "DSH 本机身份",
				lastSession: "上次",
				noCompletedSession: "暂无已完成会话",
				uploadAvatar: "上传头像",
				changeAvatar: "更换",
				uploadAvatarTitle: "上传或更换本机头像",
				yourAvatar: "你的头像",
				roomDemo: "席位状态 · 本地演示",
				roomLive: "席位状态 · 联网验签",
				shareLastSession: "自愿公开“上一个完成会话名”（默认不公开）",
				blockedCount: (count) => `已在本机屏蔽 ${count} 个身份`,
				clearBlocked: "全部取消",
				nodeOnline: (peers) => `P2P 节点在线 · ${peers} 个连接`,
				nodeStarting: "P2P 节点启动中",
				nodeError: "P2P 节点不可用",
				peerId: "节点身份",
				peerPending: "生成中",
				createInvite: "生成邀请",
				creatingInvite: "生成中…",
				inviteCode: "邀请口令",
				copy: "复制",
				copied: "已复制",
				pasteInvite: "粘贴对方的 carbon1 邀请口令",
				connectPeer: "加入",
				connecting: "连接中…",
				networkNote: (peers, bootstrap, relay) => `近场发现 ${peers} · 社区入口 ${bootstrap} · 中继预约 ${relay} · 自动重连已启用`,
				speakers: "发言席",
				seatUnit: "席",
				seatOpen: (index) => `第 ${index} 席开放`,
				seatWaiting: "等待候位者接席",
				seatActive: (index) => `第 ${index} 席 · 发言中`,
				seatWarning: "即将递补",
				departedMember: "已离开的旅客",
				lastTaskTitle: (title) => `上一个完成任务：${title}`,
				queueTitle: "候位区 · 先来后到",
				seatedSelf: "你正在发言席",
				seatedSelfHint: "不发言 2 分钟后自动让席",
				offerSelf: "轮到你接席",
				offerSeconds: (seconds) => `${seconds} 秒内确认`,
				queuePosition: (position) => `候位第 ${position} 位`,
				queuePositionHint: "可随时退出队列，围观不受影响",
				audienceCount: (count) => `${count} 人围观`,
				audienceHint: "排队不影响 Agent 继续工作",
				leaveQueue: "退出候位",
				joinQueue: "排队发言",
				offerSeat: (index) => `第 ${index} 席正在等你`,
				seconds: (seconds) => `${seconds} 秒`,
				acceptMic: "接过话筒",
				skipTurn: "这轮跳过",
				meshChat: "联网实况",
				signedEvents: (count) => `${count} 条已验签消息`,
				meshEmpty: "还没有联网消息；直连另一节点后，双方发言会出现在这里。",
				signedBy: "身份签名",
				profileSelfReported: "昵称与备注由本人自述",
				blockPeer: "本地屏蔽",
				copyEvidence: "复制证据",
				evidenceCopied: "验签证据已复制",
				hallChat: "候车室样例",
				demoConversation: "本机演示内容",
				audienceReactions: "围观者只显示反应",
				lockedRoom: "这是后续房型预告。",
				p2pComing: "公开社区测试版暂只开放大厅。",
				seatedPlaceholder: "说点什么，别把 Agent 的上下文拖进来…",
				audiencePlaceholder: "围观中；排到发言席后可输入",
				send: "发送",
				zeroModel: "0 次模型调用 · 消息不进入 Agent 上下文",
				errors: {
					"not-seated": "围观状态不能发言，先排队接席。",
					empty: "写点什么再发送。",
					"too-long": "单条最多 400 字。",
					"slow-mode": "大厅是 8 秒慢速模式。",
					"consecutive-limit": "连续两条后，先把话筒交给别人。"
				},
				networkErrors: {
					HALL_NOT_JOINED: "请先排队，获得发言席后再开口。",
					HALL_NOT_SEATED: "还在候位队列中，暂时不能发言。",
					HALL_PROFILE_SYNC: "身份资料正在同步，请稍后再试。",
					HALL_RATE_LIMIT: "发言过快或已连续两条，请把话筒留给别人。"
				},
				avatarErrors: {
					type: "请选择 JPG、PNG 或 WebP 图片。",
					size: "头像文件不能超过 5 MB。",
					compressed: "头像压缩后仍过大，请换一张更简单的图片。",
					read: "图片读取失败，请换一张试试。",
					decode: "无法识别这张图片。",
					canvas: "当前浏览器无法处理头像。",
					unknown: "头像处理失败。"
				}
			},
			en: {
				clubName: "Carbon Club",
				openClub: "Open Carbon Club",
				collapseClub: "Collapse Carbon Club",
				switchLanguage: "切换到中文",
				roomsLabel: "Rooms",
				agentRunning: "Agent at work · humans can take a breather",
				agentIdle: "Agent idle · the club stays open",
				localIdentity: "Local DSH identity",
				lastSession: "Last",
				noCompletedSession: "No completed session yet",
				uploadAvatar: "Upload avatar",
				changeAvatar: "Change",
				uploadAvatarTitle: "Upload or change local avatar",
				yourAvatar: "Your avatar",
				roomDemo: "Seat state · Local demo",
				roomLive: "Seats · Signed mesh state",
				shareLastSession: "Share last completed session name (off by default)",
				blockedCount: (count) => `${count} identity(s) hidden locally`,
				clearBlocked: "Clear all",
				nodeOnline: (peers) => `P2P node online · ${peers} connection(s)`,
				nodeStarting: "P2P node starting",
				nodeError: "P2P node unavailable",
				peerId: "Peer ID",
				peerPending: "Generating",
				createInvite: "Create invite",
				creatingInvite: "Creating…",
				inviteCode: "Invite code",
				copy: "Copy",
				copied: "Copied",
				pasteInvite: "Paste the other peer’s carbon1 invite",
				connectPeer: "Join",
				connecting: "Connecting…",
				networkNote: (peers, bootstrap, relay) => `Nearby ${peers} · community entry ${bootstrap} · relay reservation ${relay} · auto-reconnect on`,
				speakers: "Speaking seats",
				seatUnit: "seats",
				seatOpen: (index) => `Seat ${index} open`,
				seatWaiting: "Waiting for the next person",
				seatActive: (index) => `Seat ${index} · Speaking`,
				seatWarning: "Rotating soon",
				departedMember: "Departed traveller",
				lastTaskTitle: (title) => `Last completed task: ${title}`,
				queueTitle: "Queue · First come, first served",
				seatedSelf: "You have a speaking seat",
				seatedSelfHint: "Two idle minutes releases it",
				offerSelf: "A seat is ready for you",
				offerSeconds: (seconds) => `Confirm within ${seconds}s`,
				queuePosition: (position) => `Queue position ${position}`,
				queuePositionHint: "Leave anytime without stopping your view",
				audienceCount: (count) => `${count} watching`,
				audienceHint: "Queuing does not interrupt your Agent",
				leaveQueue: "Leave queue",
				joinQueue: "Join queue",
				offerSeat: (index) => `Seat ${index} is waiting for you`,
				seconds: (seconds) => `${seconds}s`,
				acceptMic: "Take the mic",
				skipTurn: "Skip this turn",
				meshChat: "Live mesh",
				signedEvents: (count) => `${count} verified message(s)`,
				meshEmpty: "No network messages yet. Connect another peer and signed posts will appear here.",
				signedBy: "Identity signed",
				profileSelfReported: "name and note are self-reported",
				blockPeer: "Hide locally",
				copyEvidence: "Copy evidence",
				evidenceCopied: "Verified evidence copied",
				hallChat: "Waiting-room sample",
				demoConversation: "Local demo content",
				audienceReactions: "Audience reactions only",
				lockedRoom: "This room type is a roadmap preview.",
				p2pComing: "The public community beta currently enables the lobby only.",
				seatedPlaceholder: "Say something—Agent context stays out of here…",
				audiencePlaceholder: "Watching; input opens when you get a seat",
				send: "Send",
				zeroModel: "0 model calls · Messages never enter Agent context",
				errors: {
					"not-seated": "Audience members cannot post. Join the queue first.",
					empty: "Write something before sending.",
					"too-long": "Messages are limited to 400 characters.",
					"slow-mode": "The lobby uses an 8-second slow mode.",
					"consecutive-limit": "After two messages, hand the mic to someone else."
				},
				networkErrors: {
					HALL_NOT_JOINED: "Join the queue before speaking.",
					HALL_NOT_SEATED: "You are still in the queue and do not have a speaking seat yet.",
					HALL_PROFILE_SYNC: "Your profile is still syncing. Try again shortly.",
					HALL_RATE_LIMIT: "You are posting too quickly or have sent two in a row. Give someone else the mic."
				},
				avatarErrors: {
					type: "Choose a JPG, PNG, or WebP image.",
					size: "Avatar files must be 5 MB or smaller.",
					compressed: "The compressed avatar is still too large. Try a simpler image.",
					read: "Could not read that image. Try another one.",
					decode: "That image could not be decoded.",
					canvas: "This browser cannot process avatars.",
					unknown: "Avatar processing failed."
				}
			}
		};
		//#endregion
		//#region src/client/language-store.ts
		const STORAGE_KEY = "dsh-carbon-club.language.v1";
		const LANGUAGE_EVENT = "dsh-carbon-club:language";
		let language = "zh";
		let hydrated = false;
		function hydrate() {
			if (hydrated) return;
			hydrated = true;
			try {
				const saved = window.localStorage.getItem(STORAGE_KEY);
				if (saved === "zh" || saved === "en") language = saved;
			} catch {}
		}
		function setLanguage(next) {
			if (next === language) return;
			language = next;
			try {
				window.localStorage.setItem(STORAGE_KEY, next);
			} catch {}
			window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: next }));
		}
		function useLanguage() {
			const [value, setValue] = (0, react.useState)(language);
			(0, react.useEffect)(() => {
				hydrate();
				setValue(language);
				const update = (event) => {
					const next = event.detail;
					if (next === "zh" || next === "en") {
						language = next;
						setValue(next);
					}
				};
				window.addEventListener(LANGUAGE_EVENT, update);
				return () => {
					window.removeEventListener(LANGUAGE_EVENT, update);
				};
			}, []);
			return value;
		}
		//#endregion
		//#region src/client/room-catalog.ts
		const CATALOG = [
			{
				id: "hall",
				zh: {
					shortName: "大厅",
					name: "碳基会所",
					description: "蹬 DSH，没事侃侃，吹水只有八席，其余围观排队。",
					status: "500 人 · 8 席",
					rules: [
						"2 分钟不发言会提醒",
						"30 秒后自动递补",
						"单次坐席最多 5 分钟"
					]
				},
				en: {
					shortName: "Lobby",
					name: "Carbon Club",
					description: "Kick back while DSH works. Eight people talk; everyone else watches and queues.",
					status: "500 people · 8 seats",
					rules: [
						"Reminder after 2 idle minutes",
						"Automatic rotation after 30 seconds",
						"Maximum seat time: 5 minutes"
					]
				}
			},
			{
				id: "project",
				zh: {
					shortName: "搭子",
					name: "项目搭子间",
					description: "按项目临时结伴，只聊正在推进的一件事。",
					status: "6 席 · 项目制",
					rules: [
						"一个房间只挂一个项目",
						"先报目标再发言",
						"默认不上传仓库内容"
					]
				},
				en: {
					shortName: "Crew",
					name: "Project Crew",
					description: "Team up around one project and keep the room focused on the task at hand.",
					status: "6 seats · Project room",
					rules: [
						"One project per room",
						"State the goal before speaking",
						"Repository content stays local by default"
					]
				}
			},
			{
				id: "night",
				zh: {
					shortName: "夜航",
					name: "夜猫子候车室",
					description: "本地时间 22:00–04:00 开灯，适合低频陪伴。",
					status: "夜间开放",
					rules: [
						"10 席低频慢聊",
						"60 秒慢速模式",
						"天亮自动封存当夜记录"
					]
				},
				en: {
					shortName: "Night",
					name: "Night Owl Lounge",
					description: "Open from 22:00–04:00 local time for low-key late-night company.",
					status: "Open at night",
					rules: [
						"10 seats for low-frequency chat",
						"60-second slow mode",
						"Nightly log seals at dawn"
					]
				}
			},
			{
				id: "tide",
				zh: {
					shortName: "潮汐",
					name: "算力潮汐站",
					description: "根据模型忙闲与价格信号聚散，忙时吐槽，闲时散场。",
					status: "数据源待接入",
					rules: [
						"只展示公开价格信号",
						"不读取对话或账单",
						"状态由多节点签名确认"
					]
				},
				en: {
					shortName: "Tide",
					name: "Compute Tide Station",
					description: "Gather when models are busy or costly; drift away when capacity returns.",
					status: "Data source pending",
					rules: [
						"Public pricing signals only",
						"Never reads chats or bills",
						"Status confirmed by multiple nodes"
					]
				}
			},
			{
				id: "dimension",
				zh: {
					shortName: "次元",
					name: "多次元安全舱",
					description: "低龄房型概念预告；完成儿童安全与合规审查前不会开放。",
					status: "合规审查中",
					rules: [
						"预设主题和有限反应",
						"禁止私聊与外链",
						"需独立儿童安全审核"
					]
				},
				en: {
					shortName: "Worlds",
					name: "Multiverse Safe Pod",
					description: "Concept preview only; it will stay closed pending child-safety and compliance review.",
					status: "Compliance review",
					rules: [
						"Preset topics and limited reactions",
						"No DMs or external links",
						"Independent child-safety review required"
					]
				}
			}
		];
		function roomsFor(language) {
			return CATALOG.map((room) => ({
				id: room.id,
				...room[language]
			}));
		}
		roomsFor("zh");
		//#endregion
		//#region src/client/panel-store.ts
		const listeners$1 = /* @__PURE__ */ new Set();
		let snapshot$1 = {
			open: false,
			width: 392
		};
		function emit$1() {
			for (const listener of listeners$1) listener();
		}
		function update(next) {
			if (next.open === snapshot$1.open && next.width === snapshot$1.width) return;
			snapshot$1 = next;
			emit$1();
		}
		function setPanelOpen(open) {
			update({
				...snapshot$1,
				open
			});
		}
		function togglePanel() {
			setPanelOpen(!snapshot$1.open);
		}
		function setPanelWidth(width) {
			update({
				...snapshot$1,
				width: Math.min(520, Math.max(300, Math.round(width)))
			});
		}
		function usePanelSnapshot() {
			return (0, react.useSyncExternalStore)((listener) => {
				listeners$1.add(listener);
				return () => {
					listeners$1.delete(listener);
				};
			}, () => snapshot$1, () => snapshot$1);
		}
		//#endregion
		//#region src/client/network-store.ts
		const listeners = /* @__PURE__ */ new Set();
		let remote;
		let snapshot = {
			phase: "starting",
			addresses: [],
			connectedPeers: 0,
			discoveredPeers: 0,
			bootstrapConfigured: 0,
			relayAddresses: 0
		};
		function emit(next) {
			snapshot = next;
			for (const listener of listeners) listener();
		}
		function failureMessage(result) {
			return result.error.message;
		}
		function bindNetworkRemote(next) {
			remote = next;
			refreshNetwork();
			return () => {
				if (remote === next) remote = void 0;
			};
		}
		async function refreshNetwork() {
			const api = remote;
			if (api === void 0) return;
			try {
				const [status, room] = await Promise.all([api.status(), api.roomDelta(snapshot.room?.cursor ?? -1)]);
				if (!status.ok) throw new Error(failureMessage(status));
				if (!room.ok) throw new Error(failureMessage(room));
				emit({
					...status.value,
					room: mergeRoom(snapshot.room, room.value),
					...snapshot.invite === void 0 ? {} : { invite: snapshot.invite },
					...snapshot.busy === void 0 ? {} : { busy: snapshot.busy },
					...snapshot.actionError === void 0 ? {} : { actionError: snapshot.actionError }
				});
			} catch (error) {
				emit({
					...snapshot,
					phase: "error",
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
		function mergeRoom(previous, delta) {
			if (previous === void 0 || delta.reset) {
				const { reset: _reset, ...room } = delta;
				return room;
			}
			const byId = new Map(previous.messages.map((message) => [message.id, message]));
			for (const message of delta.messages) byId.set(message.id, message);
			return {
				roomId: "hall",
				seats: delta.seats,
				queue: delta.queue,
				queueCount: delta.queueCount,
				participantCount: delta.participantCount,
				capacity: delta.capacity,
				...delta.localQueuePosition === void 0 ? {} : { localQueuePosition: delta.localQueuePosition },
				profiles: {
					...previous.profiles,
					...delta.profiles
				},
				avatars: {
					...previous.avatars,
					...delta.avatars
				},
				messages: [...byId.values()].sort((left, right) => left.sentAt - right.sentAt || left.origin.localeCompare(right.origin) || left.sequence - right.sequence).slice(-200),
				cursor: delta.cursor,
				...delta.checkpoint === void 0 ? {} : { checkpoint: delta.checkpoint },
				updatedAt: delta.updatedAt
			};
		}
		async function requestEvidence(eventId) {
			const api = remote;
			if (api === void 0) return void 0;
			const result = await api.evidence(eventId);
			if (!result.ok) {
				emit({
					...snapshot,
					actionError: failureMessage(result)
				});
				return;
			}
			return result.value;
		}
		async function postNetworkMessage(input) {
			const api = remote;
			if (api === void 0) {
				emit({
					...snapshot,
					actionError: "Carbon Club Host connection is unavailable"
				});
				return false;
			}
			try {
				const result = await api.postRoomMessage(input);
				if (!result.ok) throw new Error(failureMessage(result));
				const currentRoom = snapshot.room;
				if (currentRoom !== void 0) {
					const previous = currentRoom.messages;
					emit({
						...snapshot,
						room: {
							...currentRoom,
							messages: previous.some((message) => message.id === result.value.id) ? previous : [...previous, result.value],
							updatedAt: Math.max(currentRoom.updatedAt, result.value.sentAt)
						},
						actionError: void 0
					});
				} else await refreshNetwork();
				return true;
			} catch (error) {
				emit({
					...snapshot,
					actionError: error instanceof Error ? error.message : String(error)
				});
				return false;
			}
		}
		async function joinNetworkHall(profile) {
			const api = remote;
			if (api === void 0) {
				emit({
					...snapshot,
					actionError: "Carbon Club Host connection is unavailable"
				});
				return false;
			}
			emit({
				...snapshot,
				busy: "hall",
				actionError: void 0
			});
			try {
				const result = await api.joinHall(profile);
				if (!result.ok) throw new Error(failureMessage(result));
				emit({
					...snapshot,
					room: result.value,
					busy: void 0,
					actionError: void 0
				});
				return true;
			} catch (error) {
				emit({
					...snapshot,
					busy: void 0,
					actionError: error instanceof Error ? error.message : String(error)
				});
				return false;
			}
		}
		async function leaveNetworkHall() {
			const api = remote;
			if (api === void 0) {
				emit({
					...snapshot,
					actionError: "Carbon Club Host connection is unavailable"
				});
				return false;
			}
			emit({
				...snapshot,
				busy: "hall",
				actionError: void 0
			});
			try {
				const result = await api.leaveHall();
				if (!result.ok) throw new Error(failureMessage(result));
				emit({
					...snapshot,
					room: result.value,
					busy: void 0,
					actionError: void 0
				});
				return true;
			} catch (error) {
				emit({
					...snapshot,
					busy: void 0,
					actionError: error instanceof Error ? error.message : String(error)
				});
				return false;
			}
		}
		async function requestInvite() {
			const api = remote;
			if (api === void 0) {
				emit({
					...snapshot,
					actionError: "Carbon Club Host connection is unavailable"
				});
				return;
			}
			emit({
				...snapshot,
				busy: "invite",
				actionError: void 0
			});
			try {
				const result = await api.createInvite();
				if (!result.ok) throw new Error(failureMessage(result));
				emit({
					...snapshot,
					invite: result.value,
					busy: void 0,
					actionError: void 0
				});
			} catch (error) {
				emit({
					...snapshot,
					busy: void 0,
					actionError: error instanceof Error ? error.message : String(error)
				});
			}
		}
		async function connectWithInvite(code) {
			const api = remote;
			if (api === void 0) {
				emit({
					...snapshot,
					actionError: "Carbon Club Host connection is unavailable"
				});
				return false;
			}
			emit({
				...snapshot,
				busy: "connect",
				actionError: void 0
			});
			try {
				const result = await api.connect(code);
				if (!result.ok) throw new Error(failureMessage(result));
				emit({
					...snapshot,
					busy: void 0,
					actionError: void 0
				});
				await refreshNetwork();
				return result.value.connected;
			} catch (error) {
				emit({
					...snapshot,
					busy: void 0,
					actionError: error instanceof Error ? error.message : String(error)
				});
				return false;
			}
		}
		function useNetworkSnapshot() {
			return (0, react.useSyncExternalStore)((listener) => {
				listeners.add(listener);
				return () => {
					listeners.delete(listener);
				};
			}, () => snapshot, () => snapshot);
		}
		//#endregion
		//#region src/client/HumanBuffer.tsx
		function timeLabel(at, language) {
			return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-GB", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false
			}).format(at);
		}
		const LOCAL_AVATAR_KEY = "dsh-carbon-club.local-avatar.v1";
		const BLOCKED_PEERS_KEY = "dsh-carbon-club.blocked-peers.v1";
		const MAX_AVATAR_BYTES = 5242880;
		const MAX_NETWORK_AVATAR_LENGTH = 12288;
		function loadLocalAvatar() {
			try {
				return window.localStorage.getItem(LOCAL_AVATAR_KEY) ?? void 0;
			} catch {
				return;
			}
		}
		function storeLocalAvatar(value) {
			try {
				window.localStorage.setItem(LOCAL_AVATAR_KEY, value);
			} catch {}
		}
		async function avatarDataUrl(file, language) {
			const errors = COPY[language].avatarErrors;
			if (![
				"image/jpeg",
				"image/png",
				"image/webp"
			].includes(file.type)) throw new Error(errors.type);
			if (file.size > MAX_AVATAR_BYTES) throw new Error(errors.size);
			const source = await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onerror = () => {
					reject(new Error(errors.read));
				};
				reader.onload = () => {
					typeof reader.result === "string" ? resolve(reader.result) : reject(new Error(errors.read));
				};
				reader.readAsDataURL(file);
			});
			const image = await new Promise((resolve, reject) => {
				const element = new Image();
				element.onerror = () => {
					reject(new Error(errors.decode));
				};
				element.onload = () => {
					resolve(element);
				};
				element.src = source;
			});
			const canvas = document.createElement("canvas");
			canvas.width = 96;
			canvas.height = 96;
			const context = canvas.getContext("2d");
			if (context === null) throw new Error(errors.canvas);
			const edge = Math.min(image.naturalWidth, image.naturalHeight);
			context.drawImage(image, (image.naturalWidth - edge) / 2, (image.naturalHeight - edge) / 2, edge, edge, 0, 0, 96, 96);
			const result = canvas.toDataURL("image/webp", .72);
			if (result.length > MAX_NETWORK_AVATAR_LENGTH) throw new Error(errors.compressed);
			return result;
		}
		function loadBlockedPeers() {
			try {
				const parsed = JSON.parse(window.localStorage.getItem(BLOCKED_PEERS_KEY) ?? "[]");
				return new Set(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string").slice(0, 256) : []);
			} catch {
				return /* @__PURE__ */ new Set();
			}
		}
		function saveBlockedPeers(peers) {
			try {
				window.localStorage.setItem(BLOCKED_PEERS_KEY, JSON.stringify([...peers].slice(0, 256)));
			} catch {}
		}
		function HallSeatGrid({ seats, avatars, localPeerId, language }) {
			const copy = COPY[language];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "hb-seats",
				children: seats.map((seat, index) => {
					const participant = seat?.participant;
					const warning = seat !== null && seat !== void 0 && seat.idleExpiresAt - Date.now() <= 3e4;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "hb-seat",
						"data-warning": warning || void 0,
						"data-local": participant?.peerId === localPeerId || void 0,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "hb-seat-avatar",
							style: { "--seat-color": participant === void 0 ? "#d6d9dd" : peerColor(participant.peerId) },
							children: participant?.profile.avatarCid !== void 0 && avatars[participant.profile.avatarCid] !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								src: avatars[participant.profile.avatarCid],
								alt: ""
							})
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "hb-seat-copy",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "hb-seat-name",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: participant?.profile.name ?? copy.seatOpen(index + 1) }), participant?.profile.lastCompletedSession !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "hb-member-note",
									title: copy.lastTaskTitle(participant.profile.lastCompletedSession),
									children: [
										" · ",
										copy.lastSession,
										language === "zh" ? "：" : ": ",
										participant.profile.lastCompletedSession
									]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "hb-seat-state",
								children: warning ? copy.seatWarning : participant === void 0 ? copy.seatWaiting : `${copy.seatActive(index + 1)} · ${participant.peerId.slice(0, 6)}…`
							})]
						})]
					}, index);
				})
			});
		}
		function peerColor(peerId) {
			let hash = 0;
			for (const char of peerId) hash = hash * 31 + char.charCodeAt(0) >>> 0;
			return `hsl(${hash % 360} 32% 54%)`;
		}
		function networkErrorLabel(error, language) {
			if (error === void 0) return void 0;
			return COPY[language].networkErrors[error] ?? error;
		}
		function MeshMessages({ messages, profiles, avatars, blockedPeers, language, onBlock, onEvidence }) {
			const copy = COPY[language];
			const visible = messages.filter((message) => !blockedPeers.has(message.origin));
			if (visible.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "hb-mesh-empty",
				children: copy.meshEmpty
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "hb-messages hb-mesh-messages",
				children: visible.slice(-30).map((message) => {
					const profile = profiles[message.origin] ?? { name: `${message.origin.slice(0, 8)}…` };
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "hb-message",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "hb-message-avatar",
							style: { "--member-color": peerColor(message.origin) },
							children: profile.avatarCid !== void 0 && avatars[profile.avatarCid] !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								src: avatars[profile.avatarCid],
								alt: ""
							})
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "hb-message-meta",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "hb-message-name",
									children: [profile.name, profile.lastCompletedSession !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "hb-member-note",
										children: [
											" · ",
											copy.lastSession,
											language === "zh" ? "：" : ": ",
											profile.lastCompletedSession
										]
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "hb-message-time",
									children: timeLabel(message.sentAt, language)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "hb-message-body",
								children: message.body
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "hb-message-proof",
								title: message.origin,
								children: [
									copy.signedBy,
									" ",
									message.origin.slice(0, 8),
									"… · ",
									copy.profileSelfReported,
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "hb-message-tools",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												onEvidence(message.id);
											},
											children: copy.copyEvidence
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												onBlock(message.origin);
											},
											children: copy.blockPeer
										})]
									})
								]
							})
						] })]
					}, message.id);
				})
			});
		}
		function NetworkCard({ language }) {
			const copy = COPY[language];
			const network = useNetworkSnapshot();
			const [joinCode, setJoinCode] = (0, react.useState)("");
			const [copied, setCopied] = (0, react.useState)(false);
			const peerLabel = network.peerId === void 0 ? copy.peerPending : `${network.peerId.slice(0, 8)}…${network.peerId.slice(-6)}`;
			const statusLabel = network.phase === "online" ? copy.nodeOnline(network.connectedPeers) : network.phase === "error" ? copy.nodeError : copy.nodeStarting;
			const displayedError = networkErrorLabel(network.actionError ?? network.error, language);
			async function copyInvite() {
				if (network.invite === void 0) return;
				await navigator.clipboard.writeText(network.invite.code);
				setCopied(true);
				window.setTimeout(() => {
					setCopied(false);
				}, 1500);
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "hb-network",
				"data-phase": network.phase,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "hb-network-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "hb-network-title",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "hb-network-dot" }), statusLabel]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "hb-peer",
							title: network.peerId,
							children: [
								copy.peerId,
								": ",
								peerLabel
							]
						})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: network.phase !== "online" || network.busy !== void 0,
							onClick: () => {
								requestInvite();
							},
							children: network.busy === "invite" ? copy.creatingInvite : copy.createInvite
						})]
					}),
					network.invite !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "hb-invite-output",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							readOnly: true,
							value: network.invite.code,
							"aria-label": copy.inviteCode
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								copyInvite();
							},
							children: copied ? copy.copied : copy.copy
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "hb-join",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							value: joinCode,
							placeholder: copy.pasteInvite,
							"aria-label": copy.pasteInvite,
							onChange: (event) => {
								setJoinCode(event.target.value);
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: joinCode.trim() === "" || network.busy !== void 0,
							onClick: () => {
								connectWithInvite(joinCode).then((connected) => {
									if (connected) setJoinCode("");
								});
							},
							children: network.busy === "connect" ? copy.connecting : copy.connectPeer
						})]
					}),
					displayedError !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "hb-network-error",
						role: "alert",
						children: displayedError
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "hb-network-note",
						children: copy.networkNote(network.discoveredPeers, network.bootstrapConfigured, network.relayAddresses)
					})
				]
			});
		}
		function HumanBufferHeaderAction({ useSessions }) {
			const language = useLanguage();
			const copy = COPY[language];
			const running = useSessions((state) => {
				const current = state.current;
				return current !== void 0 && state.byId[current]?.running === true;
			});
			const panel = usePanelSnapshot();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				className: "hb-trigger",
				type: "button",
				"aria-label": panel.open ? copy.collapseClub : copy.openClub,
				"aria-expanded": panel.open,
				onClick: togglePanel,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "hb-trigger-dot",
					"data-running": running || void 0
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy.clubName })]
			});
		}
		function HumanBufferOverlay({ useSessions }) {
			const language = useLanguage();
			const copy = COPY[language];
			const panel = usePanelSnapshot();
			const network = useNetworkSnapshot();
			const hasSession = useSessions((state) => state.current !== void 0);
			const running = useSessions((state) => {
				const current = state.current;
				return current !== void 0 && state.byId[current]?.running === true;
			});
			const [roomId, setRoomId] = (0, react.useState)("hall");
			const [draft, setDraft] = (0, react.useState)("");
			const [localAvatar, setLocalAvatar] = (0, react.useState)(loadLocalAvatar);
			const [avatarError, setAvatarError] = (0, react.useState)();
			const [shareLastSession, setShareLastSession] = (0, react.useState)(false);
			const [blockedPeers, setBlockedPeers] = (0, react.useState)(loadBlockedPeers);
			const [evidenceCopied, setEvidenceCopied] = (0, react.useState)(false);
			const scrollRef = (0, react.useRef)(null);
			const rooms = (0, react.useMemo)(() => roomsFor(language), [language]);
			const room = rooms.find((candidate) => candidate.id === roomId) ?? rooms[0];
			const localLastCompletedSession = useSessions((state) => {
				let latest;
				for (const id of state.ids) {
					const session = state.byId[id];
					if (session?.completed !== true) continue;
					if (latest === void 0 || session.updatedAt > latest.updatedAt) latest = {
						title: session.displayTitle,
						updatedAt: session.updatedAt
					};
				}
				return latest?.title;
			});
			(0, react.useEffect)(() => {
				if (!panel.open || roomId !== "hall") return;
				scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
			}, [
				panel.open,
				roomId,
				network.room?.messages.length
			]);
			const localProfile = (0, react.useMemo)(() => ({
				name: language === "zh" ? "你 · 本机人类" : "You · Local human",
				...localAvatar === void 0 ? {} : { avatarUrl: localAvatar },
				...!shareLastSession || localLastCompletedSession === void 0 ? {} : { lastCompletedSession: localLastCompletedSession }
			}), [
				language,
				localAvatar,
				localLastCompletedSession,
				shareLastSession
			]);
			const seats = network.room?.seats ?? Array.from({ length: HALL_RULES.seatCount }, () => null);
			const localSeated = network.peerId !== void 0 && seats.some((seat) => seat?.participant.peerId === network.peerId);
			const localQueuePosition = network.room?.localQueuePosition;
			const participating = localSeated || localQueuePosition !== void 0;
			const occupiedCount = seats.filter(Boolean).length;
			(0, react.useEffect)(() => {
				if (!participating) return;
				joinNetworkHall(localProfile);
			}, [localProfile, participating]);
			const queueCopy = (0, react.useMemo)(() => {
				if (localSeated) return [copy.seatedSelf, copy.seatedSelfHint];
				if (localQueuePosition !== void 0) return [copy.queuePosition(localQueuePosition), copy.queuePositionHint];
				return [copy.audienceCount(network.room?.queueCount ?? 0), copy.audienceHint];
			}, [
				copy,
				localQueuePosition,
				localSeated,
				network.room?.queueCount
			]);
			function beginResize(event) {
				event.preventDefault();
				const startX = event.clientX;
				const startWidth = panel.width;
				const move = (next) => {
					setPanelWidth(startWidth + startX - next.clientX);
				};
				const up = () => {
					window.removeEventListener("pointermove", move);
					window.removeEventListener("pointerup", up);
				};
				window.addEventListener("pointermove", move);
				window.addEventListener("pointerup", up, { once: true });
			}
			async function send() {
				if (draft.trim() === "") return;
				const body = draft.trim();
				if (localSeated && network.phase === "online" && await postNetworkMessage({ body })) setDraft("");
			}
			async function uploadAvatar(event) {
				const input = event.currentTarget;
				const file = input.files?.[0];
				if (file === void 0) return;
				setAvatarError(void 0);
				try {
					const nextAvatar = await avatarDataUrl(file, language);
					setLocalAvatar(nextAvatar);
					storeLocalAvatar(nextAvatar);
				} catch (error) {
					setAvatarError(error instanceof Error ? error.message : copy.avatarErrors.unknown);
				} finally {
					input.value = "";
				}
			}
			function blockPeer(peerId) {
				if (peerId === network.peerId) return;
				const next = new Set(blockedPeers);
				next.add(peerId);
				setBlockedPeers(next);
				saveBlockedPeers(next);
			}
			async function copyEvidence(eventId) {
				const evidence = await requestEvidence(eventId);
				if (evidence === void 0) return;
				await navigator.clipboard.writeText(JSON.stringify(evidence, null, 2));
				setEvidenceCopied(true);
				window.setTimeout(() => {
					setEvidenceCopied(false);
				}, 1500);
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "hb-layer",
				"data-open": panel.open || void 0,
				children: [
					!hasSession && !panel.open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						className: "hb-floating",
						type: "button",
						onClick: togglePanel,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "hb-trigger-dot" }), copy.clubName]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "hb-scrim",
						onClick: () => {
							setPanelOpen(false);
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
						className: "hb-panel",
						lang: language === "zh" ? "zh-CN" : "en",
						style: { "--hb-width": `${panel.width}px` },
						"aria-label": copy.clubName,
						"aria-hidden": !panel.open,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "hb-resize",
								"aria-hidden": true,
								onPointerDown: beginResize
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
								className: "hb-head",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "hb-head-main",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "hb-eyebrow",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "hb-agent-dot",
											"data-running": running || void 0
										}), running ? copy.agentRunning : copy.agentIdle]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
										className: "hb-title",
										children: copy.clubName
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "hb-head-actions",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: "hb-language",
										type: "button",
										"aria-label": copy.switchLanguage,
										title: copy.switchLanguage,
										onClick: () => {
											setLanguage(language === "zh" ? "en" : "zh");
										},
										children: language === "zh" ? "EN" : "中"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: "hb-collapse",
										type: "button",
										"aria-label": copy.collapseClub,
										onClick: () => {
											setPanelOpen(false);
										},
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
											viewBox: "0 0 16 16",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m6 3 5 5-5 5" })
										})
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("nav", {
								className: "hb-rooms",
								"aria-label": copy.roomsLabel,
								children: rooms.map((candidate) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "hb-room-tab",
									"data-active": candidate.id === roomId || void 0,
									type: "button",
									onClick: () => {
										setRoomId(candidate.id);
									},
									children: candidate.shortName
								}, candidate.id))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "hb-scroll",
								ref: scrollRef,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
										className: "hb-room-card",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "hb-room-row",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "hb-room-name",
													children: room.name
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "hb-room-status",
													children: room.status
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												className: "hb-room-desc",
												children: room.description
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: "hb-rule-list",
												children: room.rules.map((rule) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "hb-rule",
													children: rule
												}, rule))
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "hb-identity",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: "hb-local hb-avatar-upload",
											title: copy.uploadAvatarTitle,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "hb-avatar",
													children: localAvatar === void 0 ? language === "zh" ? "你" : "You" : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
														src: localAvatar,
														alt: copy.yourAvatar
													})
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "hb-local-copy",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy.localIdentity }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: "hb-local-session",
														title: localLastCompletedSession ?? copy.noCompletedSession,
														children: [
															" · ",
															copy.lastSession,
															language === "zh" ? "：" : ": ",
															localLastCompletedSession ?? copy.noCompletedSession
														]
													})]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "hb-avatar-action",
													children: localAvatar === void 0 ? copy.uploadAvatar : copy.changeAvatar
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													className: "hb-avatar-input",
													type: "file",
													accept: "image/jpeg,image/png,image/webp",
													onChange: (event) => {
														uploadAvatar(event);
													}
												})
											]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "hb-net",
											children: copy.roomLive
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "hb-share-session",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: shareLastSession,
											onChange: (event) => {
												setShareLastSession(event.target.checked);
											}
										}), copy.shareLastSession]
									}),
									blockedPeers.size > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "hb-blocked-summary",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy.blockedCount(blockedPeers.size) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												const next = /* @__PURE__ */ new Set();
												setBlockedPeers(next);
												saveBlockedPeers(next);
											},
											children: copy.clearBlocked
										})]
									}),
									avatarError !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "hb-avatar-error",
										role: "alert",
										children: avatarError
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NetworkCard, { language }),
									roomId === "hall" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "hb-section-head",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "hb-section-title",
												children: copy.speakers
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "hb-section-note",
												children: [
													occupiedCount,
													"/",
													HALL_RULES.seatCount,
													" ",
													copy.seatUnit
												]
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(HallSeatGrid, {
											seats,
											avatars: network.room?.avatars ?? {},
											localPeerId: network.peerId,
											language
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "hb-queue",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "hb-queue-copy",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: "hb-queue-kicker",
													children: copy.queueTitle
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "hb-queue-main",
													children: [queueCopy[0], /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: "hb-queue-detail",
														children: [" · ", queueCopy[1]]
													})]
												})]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												className: "hb-queue-button",
												"data-queued": participating || void 0,
												disabled: network.phase !== "online" || network.busy !== void 0,
												type: "button",
												onClick: () => {
													participating ? leaveNetworkHall() : joinNetworkHall(localProfile);
												},
												children: participating ? copy.leaveQueue : copy.joinQueue
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "hb-section-head",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "hb-section-title",
												children: copy.meshChat
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "hb-section-note",
												children: copy.signedEvents(network.room?.messages.length ?? 0)
											})]
										}),
										evidenceCopied && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "hb-evidence-copied",
											role: "status",
											children: copy.evidenceCopied
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MeshMessages, {
											messages: network.room?.messages ?? [],
											profiles: network.room?.profiles ?? {},
											avatars: network.room?.avatars ?? {},
											blockedPeers,
											language,
											onBlock: blockPeer,
											onEvidence: (eventId) => {
												copyEvidence(eventId);
											}
										})
									] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "hb-empty-room",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: "hb-empty-mark",
												children: "◇"
											}),
											copy.lockedRoom,
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("br", {}),
											copy.p2pComing
										] })
									})
								]
							}),
							roomId === "hall" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
								className: "hb-compose",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "hb-compose-box",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										value: draft,
										maxLength: HALL_RULES.maxMessageLength,
										disabled: !localSeated,
										placeholder: localSeated ? copy.seatedPlaceholder : copy.audiencePlaceholder,
										onChange: (event) => {
											setDraft(event.target.value);
										},
										onKeyDown: (event) => {
											if (event.key === "Enter" && !event.shiftKey) {
												event.preventDefault();
												send();
											}
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: "hb-send",
										type: "button",
										disabled: !localSeated || draft.trim() === "",
										onClick: () => {
											send();
										},
										children: copy.send
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "hb-compose-hint",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy.zeroModel }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
										draft.length,
										"/",
										HALL_RULES.maxMessageLength
									] })]
								})]
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/styles.ts
		const STYLE_ID = "dsh-human-buffer-styles";
		const styles = String.raw`
.hb-layer,.hb-trigger{--dsw-surface:var(--dsw-alias-bg-layer-1,#fff);--dsw-surface-hover:var(--dsw-alias-interactive-bg-hover,#f4f4f4);--dsw-border:var(--dsw-alias-border-l2,#dedede);--dsw-border-strong:var(--dsw-alias-border-l3,#c8c8c8);--dsw-text:var(--dsw-alias-label-primary,#242424);--dsw-text-muted:var(--dsw-alias-label-tertiary,#747b86)}
.hb-trigger{display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 10px;border:1px solid var(--dsw-border,#dedede);border-radius:8px;background:var(--dsw-surface,#fff);color:var(--dsw-text,#242424);font:500 12px/1 system-ui;cursor:pointer;transition:.16s ease}.hb-trigger:hover{background:var(--dsw-surface-hover,#f4f4f4);border-color:var(--dsw-border-strong,#c8c8c8)}.hb-trigger-dot{width:6px;height:6px;border-radius:50%;background:#7f8b99}.hb-trigger-dot[data-running=true]{background:#54a679;box-shadow:0 0 0 3px color-mix(in srgb,#54a679 18%,transparent)}
.hb-layer{position:absolute;inset:0;pointer-events:none;z-index:40;overflow:hidden}.hb-floating{position:absolute;top:14px;right:14px;display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 11px;border:1px solid var(--dsw-border,#dedede);border-radius:10px;background:color-mix(in srgb,var(--dsw-surface,#fff) 92%,#5e82bd 8%);color:var(--dsw-text,#242424);box-shadow:0 8px 28px rgba(18,24,38,.1);font:600 11px/1 system-ui;cursor:pointer;pointer-events:auto}.hb-floating:hover{transform:translateY(-1px);box-shadow:0 10px 32px rgba(18,24,38,.14)}.hb-scrim{position:absolute;inset:0;background:rgba(16,20,28,.2);opacity:0;transition:opacity .2s;pointer-events:none}.hb-panel{--hb-width:392px;position:absolute;top:8px;right:8px;bottom:8px;width:min(var(--hb-width),calc(100vw - 16px));display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--dsw-border,#dedede);border-radius:14px;background:var(--dsw-surface,#fff);color:var(--dsw-text,#242424);box-shadow:0 18px 70px rgba(18,24,38,.18);transform:translateX(calc(100% + 20px));opacity:.3;transition:transform .22s cubic-bezier(.22,.8,.28,1),opacity .18s;pointer-events:none}.hb-layer[data-open=true] .hb-panel{transform:translateX(0);opacity:1;pointer-events:auto}.hb-resize{position:absolute;left:-5px;top:68px;bottom:0;width:10px;cursor:ew-resize;touch-action:none}.hb-resize:after{content:"";position:absolute;left:4px;top:20px;width:2px;height:48px;border-radius:2px;background:transparent;transition:.15s}.hb-resize:hover:after{background:var(--dsw-border-strong,#c6c6c6)}
.hb-head{display:flex;align-items:flex-start;gap:12px;padding:15px 16px 11px;border-bottom:1px solid var(--dsw-border,#e6e6e6)}.hb-head-main{min-width:0;flex:1}.hb-eyebrow{display:flex;align-items:center;gap:7px;color:var(--dsw-text-muted,#747b86);font:500 11px/1.2 system-ui}.hb-agent-dot{width:7px;height:7px;border-radius:50%;background:#7b8491}.hb-agent-dot[data-running=true]{background:#56aa7d;animation:hb-pulse 1.8s infinite}.hb-title{margin:5px 0 0;font:650 17px/1.2 system-ui;letter-spacing:-.02em}.hb-head-actions{display:flex;align-items:center;gap:2px}.hb-language{height:26px;padding:0 7px;border:1px solid var(--dsw-border,#dedede);border-radius:7px;background:transparent;color:var(--dsw-text-muted,#747b86);font:650 10px/1 system-ui;cursor:pointer}.hb-language:hover,.hb-collapse:hover{background:var(--dsw-surface-hover,#f1f2f4);color:var(--dsw-text,#242424)}.hb-collapse{display:grid;place-items:center;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:inherit;cursor:pointer}.hb-collapse svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.hb-rooms{display:flex;gap:4px;padding:8px 10px;border-bottom:1px solid var(--dsw-border,#e6e6e6);overflow-x:auto;scrollbar-width:none}.hb-room-tab{flex:0 0 auto;padding:7px 9px;border:0;border-radius:8px;background:transparent;color:var(--dsw-text-muted,#727985);font:500 12px/1 system-ui;cursor:pointer}.hb-room-tab[data-active=true]{background:var(--dsw-surface-hover,#eef1f5);color:var(--dsw-text,#222)}
.hb-scroll{flex:1;min-height:0;overflow:auto;padding:12px}.hb-room-card{padding:12px;border:1px solid var(--dsw-border,#e2e4e8);border-radius:12px;background:color-mix(in srgb,var(--dsw-surface,#fff) 94%,#7894b8 6%)}.hb-room-row{display:flex;justify-content:space-between;gap:10px}.hb-room-name{font:650 14px/1.25 system-ui}.hb-room-status{white-space:nowrap;color:#4d759f;font:600 11px/1.3 system-ui}.hb-room-desc{margin:6px 0 9px;color:var(--dsw-text-muted,#6f7680);font:12px/1.45 system-ui}.hb-rule-list{display:flex;flex-wrap:wrap;gap:5px}.hb-rule{padding:4px 6px;border-radius:6px;background:var(--dsw-surface,#fff);color:var(--dsw-text-muted,#69717c);font:10px/1.2 system-ui}
.hb-identity{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:10px 0;color:var(--dsw-text-muted,#757b85);font:11px/1.4 system-ui}.hb-local{display:flex;align-items:center;gap:7px;min-width:0}.hb-avatar-upload{position:relative;flex:1;cursor:pointer}.hb-avatar{display:grid;place-items:center;flex:0 0 auto;width:24px;height:24px;overflow:hidden;border-radius:8px;background:#4f7cff;color:white;font:700 10px system-ui}.hb-avatar img,.hb-seat-avatar img,.hb-message-avatar img{display:block;width:100%;height:100%;object-fit:cover}.hb-local-copy{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-text,#333)}.hb-local-session{color:var(--dsw-text-muted,#757b85);font-size:10px}.hb-avatar-action{flex:0 0 auto;padding:3px 5px;border-radius:5px;background:color-mix(in srgb,var(--dsw-surface,#fff) 75%,#4f7cff 25%);color:#456fbd;font:600 9px/1 system-ui}.hb-avatar-upload:hover .hb-avatar-action{background:color-mix(in srgb,var(--dsw-surface,#fff) 62%,#4f7cff 38%)}.hb-avatar-input{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}.hb-avatar-error{margin:-5px 0 8px 31px;color:#bd5555;font:10px/1.3 system-ui}.hb-net{display:inline-flex;align-items:center;flex:0 0 auto;gap:5px;font-size:9px}.hb-net:before{content:"";width:6px;height:6px;border-radius:50%;background:#a3a9b2}
.hb-share-session{display:flex;align-items:center;gap:6px;margin:-5px 0 10px 31px;color:var(--dsw-text-muted,#757b85);font:9px/1.3 system-ui;cursor:pointer}.hb-share-session input{width:13px;height:13px;margin:0;accent-color:#315fbe}
.hb-blocked-summary{display:flex;align-items:center;justify-content:space-between;margin:-5px 0 9px 31px;color:var(--dsw-text-muted,#757b85);font:9px/1.3 system-ui}.hb-blocked-summary button{padding:0;border:0;background:transparent;color:#456fbd;font:600 9px/1.2 system-ui;cursor:pointer}
.hb-network{margin:0 0 10px;padding:10px;border:1px solid var(--dsw-border,#e2e4e8);border-radius:10px;background:color-mix(in srgb,var(--dsw-surface,#fff) 96%,#4f7cff 4%);font-family:system-ui}.hb-network-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.hb-network-title{display:flex;align-items:center;gap:6px;font:650 11px/1.2 system-ui}.hb-network-dot{width:7px;height:7px;border-radius:50%;background:#d2a24f}.hb-network[data-phase=online] .hb-network-dot{background:#4ea675;box-shadow:0 0 0 3px color-mix(in srgb,#4ea675 15%,transparent)}.hb-network[data-phase=error] .hb-network-dot{background:#c45a5a}.hb-peer{margin:3px 0 0 13px;color:var(--dsw-text-muted,#7b828d);font:9px/1.2 ui-monospace,monospace}.hb-network button{flex:0 0 auto;padding:6px 8px;border:1px solid var(--dsw-border,#d8dce2);border-radius:7px;background:var(--dsw-surface,#fff);color:inherit;font:600 10px/1 system-ui;cursor:pointer}.hb-network button:disabled{opacity:.45;cursor:not-allowed}.hb-invite-output,.hb-join{display:flex;gap:5px;margin-top:8px}.hb-invite-output input,.hb-join input{min-width:0;flex:1;height:28px;padding:0 7px;border:1px solid var(--dsw-border,#d8dce2);border-radius:7px;background:var(--dsw-surface,#fff);color:inherit;outline:0;font:9px/1.2 ui-monospace,monospace}.hb-invite-output input:focus,.hb-join input:focus{border-color:#7191cf}.hb-network-error{margin-top:7px;color:#bd5555;font:9px/1.3 system-ui;overflow-wrap:anywhere}.hb-network-note{margin-top:7px;color:var(--dsw-text-muted,#858b94);font:9px/1.35 system-ui}
.hb-section-head{display:flex;align-items:center;justify-content:space-between;margin:14px 2px 7px}.hb-section-title{font:650 12px/1 system-ui}.hb-section-note{color:var(--dsw-text-muted,#858b94);font:10px/1 system-ui}.hb-seats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.hb-seat{display:flex;align-items:center;gap:8px;min-width:0;padding:8px;border:1px solid var(--dsw-border,#e3e5e8);border-radius:9px;background:var(--dsw-surface,#fff)}.hb-seat-avatar{flex:0 0 auto;width:21px;height:21px;overflow:hidden;border-radius:7px;background:var(--seat-color,#8293a7)}.hb-seat-copy{min-width:0}.hb-seat-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:550 11px/1.25 system-ui}.hb-member-note{color:var(--dsw-text-muted,#848a93);font-size:.88em;font-weight:400}.hb-seat-state{margin-top:2px;color:var(--dsw-text-muted,#848a93);font:9px/1.2 system-ui}.hb-seat[data-warning=true]{box-shadow:inset 2px 0 #d4a24f}
.hb-seat[data-local=true]{border-color:#6f91d4;box-shadow:inset 2px 0 #4f7fcc}
.hb-queue{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:8px 10px;border-radius:10px;background:var(--dsw-surface-hover,#f4f5f7)}.hb-queue-copy{min-width:0;flex:1}.hb-queue-kicker{margin-bottom:3px;color:var(--dsw-text-muted,#7e858f);font:600 9px/1.1 system-ui}.hb-queue-main{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 11px/1.25 system-ui}.hb-queue-detail{color:var(--dsw-text-muted,#7e858f);font-weight:400}.hb-queue-event{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px;color:var(--dsw-text-muted,#7e858f);font:10px/1.2 system-ui}.hb-queue-button{flex:0 0 auto;padding:7px 9px;border:0;border-radius:8px;background:#315fbe;color:#fff;font:600 11px/1 system-ui;cursor:pointer}.hb-queue-button[data-queued=true]{background:var(--dsw-surface,#fff);color:var(--dsw-text,#333);border:1px solid var(--dsw-border,#d9dce1)}
.hb-queue-button:disabled{opacity:.45;cursor:not-allowed}
.hb-offer{margin-top:7px;padding:9px 10px;border:1px solid #78a38b;border-radius:10px;background:color-mix(in srgb,var(--dsw-surface,#fff) 90%,#70aa85 10%)}.hb-offer-actions{display:flex;gap:6px;margin-top:7px}.hb-offer-actions button{padding:6px 8px;border-radius:7px;border:1px solid var(--dsw-border,#d4d7dc);background:var(--dsw-surface,#fff);color:inherit;font:600 10px system-ui;cursor:pointer}.hb-offer-actions button:first-child{border-color:#417d5b;background:#417d5b;color:#fff}
.hb-messages{display:flex;flex-direction:column;gap:10px}.hb-message{display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px}.hb-message-avatar{width:24px;height:24px;overflow:hidden;border-radius:8px;background:var(--member-color,#8492a2)}.hb-message-meta{display:flex;align-items:baseline;gap:6px;min-width:0}.hb-message-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 11px/1 system-ui}.hb-message-time{flex:0 0 auto;color:var(--dsw-text-muted,#969ba3);font:9px/1 system-ui}.hb-message-body{margin-top:4px;color:var(--dsw-text,#34383d);font:12px/1.45 system-ui;overflow-wrap:anywhere}
.hb-mesh-messages{padding:9px;border:1px solid color-mix(in srgb,var(--dsw-border,#e2e4e8) 75%,#4ea675 25%);border-radius:10px;background:color-mix(in srgb,var(--dsw-surface,#fff) 96%,#4ea675 4%)}.hb-mesh-empty{padding:12px;border:1px dashed var(--dsw-border,#dfe2e7);border-radius:10px;color:var(--dsw-text-muted,#7e858f);font:10px/1.45 system-ui;text-align:center}.hb-message-proof{margin-top:3px;color:#4f8b68;font:8px/1.2 ui-monospace,monospace}.hb-message-tools{display:inline-flex;gap:4px;margin-left:7px}.hb-message-tools button{padding:0;border:0;background:transparent;color:var(--dsw-text-muted,#858b94);font:8px/1.2 system-ui;cursor:pointer}.hb-message-tools button:hover{color:#456fbd}.hb-evidence-copied{margin:0 0 6px;color:#4f8b68;font:10px/1.3 system-ui;text-align:center}
.hb-empty-room{display:grid;place-items:center;min-height:180px;padding:20px;text-align:center;color:var(--dsw-text-muted,#747b85);font:12px/1.6 system-ui}.hb-empty-mark{display:grid;place-items:center;width:42px;height:42px;margin:0 auto 10px;border:1px solid var(--dsw-border,#dfe2e7);border-radius:14px;background:var(--dsw-surface-hover,#f4f5f7);font-size:18px}
.hb-compose{padding:10px;border-top:1px solid var(--dsw-border,#e2e4e8);background:var(--dsw-surface,#fff)}.hb-compose-box{display:flex;gap:7px;align-items:flex-end;padding:7px;border:1px solid var(--dsw-border,#d9dce1);border-radius:10px;background:var(--dsw-surface,#fff)}.hb-compose textarea{flex:1;min-width:0;min-height:32px;max-height:90px;resize:none;border:0;outline:0;background:transparent;color:inherit;font:12px/1.4 system-ui}.hb-send{height:30px;padding:0 10px;border:0;border-radius:8px;background:#315fbe;color:#fff;font:600 11px system-ui;cursor:pointer}.hb-send:disabled{opacity:.42;cursor:not-allowed}.hb-compose-hint{display:flex;justify-content:space-between;margin:5px 2px 0;color:var(--dsw-text-muted,#8a9098);font:9px/1.2 system-ui}.hb-error{color:#bd5555}
@keyframes hb-pulse{0%,100%{box-shadow:0 0 0 0 rgba(86,170,125,.15)}50%{box-shadow:0 0 0 4px rgba(86,170,125,.04)}}
@media(max-width:760px){.hb-scrim{pointer-events:auto}.hb-layer[data-open=true] .hb-scrim{opacity:1}.hb-panel{top:6px;right:6px;bottom:6px;width:calc(100vw - 12px);border-radius:13px}.hb-resize{display:none}.hb-seats{grid-template-columns:1fr 1fr}}
@media(max-width:420px){.hb-seats{grid-template-columns:1fr}.hb-trigger span:last-child{display:none}}
`;
		//#endregion
		//#region src/client/index.ts
		const inject = ["slots", "remote"];
		async function apply(ctx) {
			const unmount = await ctx.remote.$mount(TYPERT_REMOTE);
			const carbonClub = ctx.get("remote.carbonClub");
			if (carbonClub === void 0) {
				await unmount();
				throw new Error("Carbon Club Remote namespace did not mount");
			}
			const unbind = bindNetworkRemote(carbonClub);
			const timer = globalThis.setInterval(() => {
				refreshNetwork();
			}, 3e3);
			ctx.effect(() => {
				if (document.getElementById("dsh-human-buffer-styles") !== null) return () => {};
				const tag = document.createElement("style");
				tag.id = STYLE_ID;
				tag.dataset.plugin = "dsh-human-buffer";
				tag.textContent = styles;
				document.head.appendChild(tag);
				return () => {
					tag.remove();
				};
			}, "human-buffer: styles");
			ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
				name: "conversation.session.header.utilities",
				id: "human-buffer-trigger",
				order: 80
			}, HumanBufferHeaderAction));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "human-buffer-panel",
				order: 40
			}, HumanBufferOverlay));
			return async () => {
				globalThis.clearInterval(timer);
				unbind();
				await unmount();
			};
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map