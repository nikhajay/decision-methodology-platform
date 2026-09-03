const configs = {
    appName: import.meta.env.VITE_APP_NAME,
    subTitle: import.meta.env.VITE_SUB_TITLE,
    shortDescription: import.meta.env.VITE_SHORT_DESCRIPTION,
    authToken: import.meta.env.VITE_JWT_SECRET,
    api: {
        baseUrl: import.meta.env.VITE_APP_API_URL,
        timeout: import.meta.env.VITE_TIMEOUT,
    },

    pagination: {
        defaultPage: 1,
        defaultLimit: 10,
    },

    features: {
        enableReports: true,
        enableNotifications: false,
    },

    messages: {
        somethingWentWrong: "Something went wrong",
        unauthorized: "You are not authorized",
    },
};

console.log("ENV:", import.meta.env);

export default configs;