export class DeezerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DeezerError";
	}
}

/**
 * A transient failure talking to Deezer (socket reset, DNS, timeout, 5xx/429).
 * It says nothing about whether the requested resource exists: callers must
 * not treat it as "unavailable" (e.g. fall back to a lower bitrate).
 */
export class DeezerNetworkError extends DeezerError {
	code?: string;
	status?: number;

	constructor(message: string, opts: { code?: string; status?: number; cause?: unknown } = {}) {
		super(message);
		this.name = "DeezerNetworkError";
		this.code = opts.code;
		this.status = opts.status;
		if (opts.cause !== undefined) (this as { cause?: unknown }).cause = opts.cause;
	}
}

export class WrongLicense extends DeezerError {
	format: string;

	constructor(format: string) {
		super(`Your account can't request urls for ${format} tracks`);
		this.name = "WrongLicense";
		this.format = format;
	}
}

export class WrongGeolocation extends DeezerError {
	country?: string;

	constructor(country?: string) {
		super(`The track you requested can't be streamed in country ${country}`);
		this.name = "WrongGeolocation";
		this.country = country;
	}
}

// APIError
export class APIError extends DeezerError {
	constructor(message: string) {
		super(message);
		this.name = "APIError";
	}
}
export class ItemsLimitExceededException extends APIError {
	constructor(message: string) {
		super(message);
		this.name = "ItemsLimitExceededException";
	}
}
export class PermissionException extends APIError {
	constructor(message: string) {
		super(message);
		this.name = "PermissionException";
	}
}
export class InvalidTokenException extends APIError {
	constructor(message: string) {
		super(message);
		this.name = "InvalidTokenException";
	}
}
export class WrongParameterException extends APIError {
	constructor(message: string) {
		super(message);
		this.name = "WrongParameterException";
	}
}
export class MissingParameterException extends APIError {
	constructor(message: string) {
		super(message);
		this.name = "MissingParameterException";
	}
}
export class InvalidQueryException extends APIError {
	constructor(message: string) {
		super(message);
		this.name = "InvalidQueryException";
	}
}
export class DataException extends APIError {
	constructor(message: string) {
		super(message);
		this.name = "DataException";
	}
}
export class IndividualAccountChangedNotAllowedException extends APIError {
	constructor(message: string) {
		super(message);
		this.name = "IndividualAccountChangedNotAllowedException";
	}
}
export class GWAPIError extends DeezerError {
	constructor(message: string) {
		super(message);
		this.name = "GWAPIError";
	}
}
