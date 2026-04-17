import type { ChartMode, ConnectionStatus, JadwalShalat } from './types';

export type LocalizedText = {
	original: string;
	sub: string;
};

type ChartModeContent = {
	title: LocalizedText;
	ariaLabel: LocalizedText;
};

type PrayerRow = {
	key: keyof JadwalShalat;
	label: LocalizedText;
};

type DonationLink = {
	key: 'operational' | 'prs';
	title: LocalizedText;
	url: string;
	displayUrl: string;
};

export const DASHBOARD_LANG = {
	header: {
		brand: {
			original: 'Dashboard Donasi',
			sub: 'Live-Operativspenden IWKZ'
		},
		status: {
			Connected: {
				original: 'Terhubung',
				sub: 'Connected'
			},
			'Connecting...': {
				original: 'Menghubungkan...',
				sub: 'Connecting...'
			},
			Disconnected: {
				original: 'Terputus',
				sub: 'Disconnected'
			}
		} as Record<ConnectionStatus, LocalizedText>
	},
	chartModes: {
		jumatan: {
			title: {
				original: 'Donasi Jumatan Bulanan',
				sub: 'Jumatan Einnahmen & Ausgaben von Januar bis heute'
			},
			ariaLabel: {
				original: 'Grafik donasi bulanan dalam euro untuk jumatan',
				sub: 'Monatliche Spendengrafik für Jumatan'
			}
		},
		operational: {
			title: {
				original: 'Donasi Operasional Bulanan',
				sub: 'Operative Einnahmen & Ausgaben von Januar bis heute'
			},
			ariaLabel: {
				original: 'Grafik donasi bulanan dalam euro untuk operasional',
				sub: 'Monatliche Spendengrafik für Operasional'
			}
		},
		prs: {
			title: {
				original: 'Donasi PRS Bulanan',
				sub: 'PRS Einnahmen & Ausgaben von Januar bis heute'
			},
			ariaLabel: {
				original: 'Grafik donasi bulanan dalam euro untuk prs',
				sub: 'Monatliche Spendengrafik für PRS'
			}
		}
	} as Record<ChartMode, ChartModeContent>,
	kpi: {
		operational: {
			label: {
				original: 'Operasional',
				sub: 'Operativ'
			},
			period: {
				original: 'Bulan ini',
				sub: 'Diesen Monat'
			}
		},
		prs: {
			label: {
				original: 'PRS',
				sub: 'Projekthaus'
			},
			period: {
				original: 'Donasi PRS saat ini',
				sub: 'Aktuelle PRS-Spende'
			}
		}
	},
	prayerWidget: {
		scheduleTitle: {
			original: 'Waktu Shalat',
			sub: 'Gebetszeiten'
		},
		donationTitle: {
			original: 'Donasi',
			sub: 'Spenden'
		},
		prayerRows: [
			{ key: 'subuh', label: { original: 'Subuh', sub: 'Fajr' } },
			{ key: 'terbit', label: { original: 'Terbit', sub: 'Sonnenaufgang' } },
			{ key: 'dzuhur', label: { original: 'Zuhur', sub: 'Dhuhr' } },
			{ key: 'ashr', label: { original: 'Asar', sub: 'Asr' } },
			{ key: 'maghrib', label: { original: 'Maghrib', sub: 'Maghrib' } },
			{ key: 'isya', label: { original: 'Isya', sub: 'Isha' } }
		] as PrayerRow[],
		donationLinks: [
			{
				key: 'operational',
				title: {
					original: 'Operasional',
					sub: 'Betriebsspende'
				},
				url: 'https://donasi.iwkz.de/operasional',
				displayUrl: 'donasi.iwkz.de/operasional'
			},
			{
				key: 'prs',
				title: {
					original: 'Proyek Rumah Surga (PRS)',
					sub: 'Paradieshaus-Projekt'
				},
				url: 'https://donasi.iwkz.de/prs',
				displayUrl: 'donasi.iwkz.de/prs'
			}
		] as DonationLink[]
	},
	toasts: {
		operational: {
			message: {
				original: 'Jazaakumullahu khairan atas donasinya',
				sub: 'Möge Allah es Ihnen vielfach vergelten.'
			}
		},
		prs: {
			message: {
				original: 'Donasi PRS baru diterima',
				sub: 'Neue PRS-Spende ist eingegangen.'
			}
		}
	}
} as const;
