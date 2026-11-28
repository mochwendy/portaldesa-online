const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
	!isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
	window.localStorage.removeItem('base44_access_token');
	window.localStorage.removeItem('token');
}

function getAccessToken() {
	if (isNode) return null;
	return localStorage.getItem('base44_access_token') || localStorage.getItem('token') || null;
}

const getAppParams = () => {
	if (isClearAccessTokenRequested()) {
		clearStoredAccessToken();
	}
	return {
		appId: import.meta.env.VITE_BASE44_APP_ID || 'simdesta-portal-desa',
		token: getAccessToken(),
		functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION || '1.0.0',
		appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
	}
}


export const appParams = {
	...getAppParams()
}
