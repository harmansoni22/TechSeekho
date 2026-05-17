"use client";

import ErrorScreen from "./components/error/ErrorScreen";

const NotFound = () => {
    return (
        <ErrorScreen
            type="notFound"
            homeHref="/landingpage"
            homeLabel="Go to homepage"
        />
    );
};

export default NotFound;
