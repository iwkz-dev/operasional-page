type RequestInitialDashboardUpdateOptions = {
	strapiUrl: string;
	socketToken?: string;
};

function buildDashboardUpdateUrl(strapiUrl: string) {
	return new URL('/api/webhook/publish-dashboard-update', strapiUrl).toString();
}

export async function requestInitialDashboardUpdate({
	strapiUrl,
	socketToken
}: RequestInitialDashboardUpdateOptions) {
	const headers: HeadersInit = {};

	if (socketToken) {
		headers.Authorization = `Bearer ${socketToken}`;
	}

	const response = await fetch(buildDashboardUpdateUrl(strapiUrl), {
		method: 'POST',
		headers
	});

	if (!response.ok) {
		throw new Error(`Dashboard update request failed with status ${response.status}`);
	}
}
