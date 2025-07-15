const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

export const getUniqueIdentifier = () => {
    if (IS_DEV) {
        return 'com.cynthiam.weshare.dev';
    }

    if (IS_PREVIEW) {
        return 'com.cynthiam.weshare.preview';
    }

    return 'com.cynthiam.weshare';
};

export const getAppName = () => {
    if (IS_DEV) {
        return 'WeShare (Dev)';
    }

    if (IS_PREVIEW) {
        return 'WeShare (Preview)';
    }

    return 'WeShare';
}; 