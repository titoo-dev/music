export interface ConfigStore {
	get<T = any>(key: string, userId?: string): Promise<T | null>;
	set(key: string, value: any, userId?: string): Promise<void>;
	init(): Promise<void>;
}
