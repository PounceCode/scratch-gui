import classNames from 'classnames';
import {FormattedMessage, defineMessages} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';

import communityIcon from './icon--see-community.svg';
import styles from './tw-see-inside.css';

const messages = defineMessages({
    seeInside: {
        defaultMessage: "See inside",
        description: "Label for see inside button",
        id: "tw.menuBar.seeInside"
    },
    seeProjectPage: {
        defaultMessage: "See project page",
        description: "Label for see project page button",
        id: "tw.menuBar.seeProjectPage"
    }
});

const SeeInsideButton = ({
    className,
    onClick
}) => {
    const isCurrentlyEditor = window.location.pathname.includes('editor.html');

    const handleNavigation = (e) => {
        const targetPage = isCurrentlyEditor ? 'index.html' : 'editor.html';
        const newUrl = `${window.location.protocol}//${window.location.host}/${targetPage}`

        window.history.pushState({path: newUrl}, '', newUrl);

        // This triggers the actual internal state change in TurboWarp
        onClick(e);
    };

    return (
        <Button
            className={classNames(
                className,
                styles.seeInsideButton
            )}
            iconClassName={styles.seeInsideButtonIcon}
            iconSrc={communityIcon}
            iconWidth={20}
            iconHeight={20}
            onClick={handleNavigation}
        >
            {isCurrentlyEditor ? (
                <FormattedMessage {...messages.seeProjectPage} />
            ) : (
                <FormattedMessage {...messages.seeInside} />
            )}
        </Button>
    );
};

SeeInsideButton.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func
};

SeeInsideButton.defaultProps = {
    onClick: () => {}
};

export default SeeInsideButton;
