export type PriceDataForDayRoom = {
	error?: boolean;
	error_reason?: string;
	price: number;
	price_in_pms: number | null;
};

export type PriceData = {
	currency: {
		symbol: string;
		code: string;
	};
	prices: {
		data: {
			[key: string]: {
				[key: string]: PriceDataForDayRoom;
			};
		};
		last_run_pricing_time: string;
	};
};

export type SettingsData = {
	hotel: {
		timezone: string;
		locale: string;
	};
	rooms: {
		derived: {
			[key: string]: {
				name: string;
			};
		};
		reference: {
			id: number;
			name: string;
		};
	};
};
