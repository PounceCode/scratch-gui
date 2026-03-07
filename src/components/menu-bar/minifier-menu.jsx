import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import dropdownCaret from './dropdown-caret.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import styles from './settings-menu.css';

import {openMinifierMenu, minifierMenuOpen, closeSettingsMenu} from '../../reducers/menus.js';

const MinifierMenu = ({
    isOpen,
    isRtl,
    onOpen,
    onCloseSettings
}) => {
    const enabled = !window.noMinify;
    return (
        <MenuItem expanded={isOpen}>
            <div
                className={styles.option}
                onClick={onOpen}
            >
                <span className={styles.submenuLabel}>
                    <FormattedMessage
                        defaultMessage="Minifier"
                        description="Menu label for the minifier setting"
                        id="tw.menuBar.minifier"
                    />
                </span>
                <img
                    className={styles.expandCaret}
                    src={dropdownCaret}
                    draggable={false}
                />
            </div>
            <Submenu place={isRtl ? 'left' : 'right'}>
                <MenuItem
                    onClick={() => {
                        window.noMinify = false;
                        onCloseSettings();
                    }}
                >
                    <div className={styles.option}>
                        <img
                            className={classNames(styles.check, {[styles.selected]: enabled})}
                            src={check}
                            draggable={false}
                        />
                        <FormattedMessage
                            defaultMessage="Enabled"
                            description="Enable the project minifier"
                            id="tw.menuBar.minifierEnabled"
                        />
                    </div>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        window.noMinify = true;
                        onCloseSettings();
                    }}
                >
                    <div className={styles.option}>
                        <img
                            className={classNames(styles.check, {[styles.selected]: !enabled})}
                            src={check}
                            draggable={false}
                        />
                        <FormattedMessage
                            defaultMessage="Disabled"
                            description="Disable the project minifier"
                            id="tw.menuBar.minifierDisabled"
                        />
                    </div>
                </MenuItem>
            </Submenu>
        </MenuItem>
    );
};

MinifierMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onOpen: PropTypes.func,
    onCloseSettings: PropTypes.func
};

const mapStateToProps = state => ({
    isOpen: minifierMenuOpen(state),
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = dispatch => ({
    onOpen: () => dispatch(openMinifierMenu()),
    onCloseSettings: () => dispatch(closeSettingsMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MinifierMenu);
