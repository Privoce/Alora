import React from 'react';
import ReactDOM from 'react-dom'
import {Badge, Button, Empty, Input, List, Menu, Popover, Switch} from 'antd';
import Scrollbar from 'react-scrollbars-custom';
import {observable, toJS} from 'mobx';
import {observer} from 'mobx-react';

import {getFaviconUrlByDomain, getFriendlyUrl, preventDrag, prettyPrint, getDomain, getFaviconUrlByUrl} from "./utils";

import '../css/popup.less';

import headerIcon from '../assets/images/magic.png';
import inputIcon from '../assets/images/search.png';
import emptyImage from '../assets/images/magic-hat.png';
import allowIconEnabled from '../assets/images/allow-enabled.png';
import allowIconDisabled from '../assets/images/allow-disabled.png';
import banIconEnabled from '../assets/images/ban-enabled.png';
import banIconDisabled from '../assets/images/ban-disabled.png';

const moduleName = '💻 Popup';

@observer
class Header extends React.Component {
    render() {
        return (
            <div className='header'>
                <img src={headerIcon} onDragStart={preventDrag} alt='' className='headerIcon'/>
                <div>
                    <h1 className='headerTitle'>{chrome.i18n.getMessage('title')}</h1>
                    <h2 className='headerSubTitle'>{chrome.i18n.getMessage('subTitle')}</h2>
                </div>
            </div>
        );
    }
}

@observer
class MenuBar extends React.Component {
    get badgeNumber() {
        return appState.get().trackerTabState.listItems.filter(item =>
            !item.isHeader && (item.userAllowed || appState.get().trackerTabState.siteTrusted)).length;
    }

    render() {
        return (
            <Menu
                mode='horizontal'
                selectedKeys={[internalState.activeTabKey]}
                onSelect={e => {
                    internalState.activeTabKey = e.key.toString();
                }}
            >
                <Menu.Item key='home'>{chrome.i18n.getMessage('homeTab')}</Menu.Item>
                <Menu.Item key='tracker' disabled={!appState.get().homeTabState.trackerSwitchState}>
                    <Badge
                        count={this.badgeNumber}
                        showZero={true}
                        style={{display: appState.get().homeTabState.trackerSwitchState ? 'block' : 'none'}}
                    >{chrome.i18n.getMessage('trackerTab')}</Badge>
                </Menu.Item>
                <Menu.Item key='manage'>{chrome.i18n.getMessage('manageTab')}</Menu.Item>
            </Menu>
        );
    }
}

@observer
class TagLine extends React.Component {
    render() {
        return (
            <div className='tagline'>
                <Popover
                    placement='bottomLeft'
                    content={<div>{this.props.hint}</div>}
                    trigger='hover'
                    getPopupContainer={() => document.getElementById('popover-group-1')}
                >
                    <div className='tagline-icon'>
                        <span>i</span>
                    </div>
                </Popover>
                <div className='tagline-content'>
                    <span>{this.props.content}</span>
                </div>
            </div>
        );
    }
}

@observer
class DomainDisplay extends React.Component {
    render() {
        return (
            <div className='domain-display'>
                <img src={getFaviconUrlByUrl(appState.get().homeTabState.url)} onDragStart={preventDrag} alt=''/>
                <span>{getDomain(appState.get().homeTabState.url)}</span>
            </div>
        );
    }
}

@observer
class ToggleSwitch extends React.Component {
    render() {
        return (
            <Switch checked={this.props.getChecked()} onClick={this.props.onChange}/>
        );
    }
}

@observer
class HomeTab extends React.Component {
    getCookieSwitchState = () => appState.get().manageTabState.listItems.includes(getDomain(appState.get().homeTabState.url));

    getTrackerSwitchState = () => appState.get().homeTabState.trackerSwitchState;

    toggleCookieSwitchState = () => {
        const newState = !this.getCookieSwitchState();
        chrome.runtime.sendMessage({
            src: 'popup',
            action: `${newState ? 'add' : 'del'} cookie blacklist`,
            data: {
                domain: getDomain(appState.get().homeTabState.url)
            }
        }, response => {
            if (response.result) {
                if (newState) {
                    appState.get().manageTabState.listItems.push(getDomain(appState.get().homeTabState.url));
                } else {
                    appState.get().manageTabState.listItems.remove(getDomain(appState.get().homeTabState.url));
                }
            }
        });
    };

    toggleTrackerSwitchState = () => {
        const newState = !appState.get().homeTabState.trackerSwitchState;
        chrome.runtime.sendMessage({
            src: 'popup',
            action: 'set tracker master',
            data: {
                value: newState
            }
        }, response => {
            if (response.result) {
                appState.get().homeTabState.trackerSwitchState = newState;
            }
        });
    };

    render() {
        return (
            <div className='home-tab' style={{
                display: internalState.activeTabKey === 'home' ? 'block' : 'none'
            }}>
                <div className='home-tab-box home-tab-box-cookie'>
                    <TagLine
                        content={chrome.i18n.getMessage('cookieSwitchText')}
                        hint={chrome.i18n.getMessage('cookieSwitchHint')}
                    />
                    <DomainDisplay/>
                    <ToggleSwitch
                        getChecked={this.getCookieSwitchState}
                        onChange={this.toggleCookieSwitchState}
                    />
                </div>
                <div className='home-tab-box home-tab-box-tracker'>
                    <TagLine
                        content={chrome.i18n.getMessage('trackerSwitchText')}
                        hint={chrome.i18n.getMessage('trackerSwitchHint')}
                    />
                    <ToggleSwitch
                        getChecked={this.getTrackerSwitchState}
                        onChange={this.toggleTrackerSwitchState}
                    />
                </div>
            </div>
        );
    }
}

@observer
class SingleTracker extends React.Component {
    get siteTrusted() {
        return appState.get().trackerTabState.siteTrusted;
    }

    get userAllowed() {
        return this.props.item.userAllowed;
    }

    set userAllowed(value) {
        chrome.runtime.sendMessage({
            src: 'popup',
            action: `${value ? 'add' : 'del'} tracker allowed`,
            data: {
                domain: getDomain(appState.get().homeTabState.url),
                url: this.props.item.content
            }
        }, response => {
            if (response.result) {
                this.props.item.userAllowed = value;
            }
        });
    }

    render() {
        return (
            <>
                <Popover
                    trigger='click'
                    content={(
                        <Scrollbar>
                            <span>{this.props.item.content}</span>
                        </Scrollbar>
                    )}
                    getPopupContainer={() => document.getElementById('popover-group-2')}
                >
                    <span className='single-tracker-content'>{getFriendlyUrl(this.props.item.content)}</span>
                </Popover>
                <div className='single-tracker-action'>
                    <img
                        alt=''
                        onDragStart={preventDrag}
                        src={!(this.siteTrusted || this.userAllowed) ? banIconEnabled : banIconDisabled}
                        style={{cursor: !this.siteTrusted && this.userAllowed ? 'pointer' : 'default'}}
                        onClick={() => {
                            if (!this.siteTrusted && this.userAllowed) {
                                this.userAllowed = false;
                            }
                        }}
                    />
                    <img
                        alt=''
                        onDragStart={preventDrag}
                        src={this.siteTrusted || this.userAllowed ? allowIconEnabled : allowIconDisabled}
                        style={{cursor: !this.siteTrusted && !this.userAllowed ? 'pointer' : 'default'}}
                        onClick={() => {
                            if (!this.siteTrusted && !this.userAllowed) {
                                this.userAllowed = true;
                            }
                        }}
                    />
                </div>
            </>
        );
    }
}

@observer
class TrackerList extends React.Component {
    render() {
        return (
            <List>
                {appState.get().trackerTabState.listItems.map(item => {
                    if (item.isHeader) {
                        return (
                            <List.Item key={item.content}>
                                <span className='tracker-list-header'>{item.content}</span>
                            </List.Item>
                        );
                    } else {
                        return (
                            <List.Item key={item.content}>
                                <SingleTracker item={item}/>
                            </List.Item>
                        );
                    }
                })}
            </List>
        );
    }
}

@observer
class TrackerTab extends React.Component {
    get isEmpty() {
        return appState.get().trackerTabState.listItems.length <= 0;
    }

    handleClick = () => {
        const newState = !appState.get().trackerTabState.siteTrusted;
        chrome.runtime.sendMessage({
            src: 'popup',
            action: `${newState ? 'add' : 'del'} tracker whitelist`,
            data: {
                domain: getDomain(appState.get().homeTabState.url)
            }
        }, response => {
            if (response.result) {
                appState.get().trackerTabState.siteTrusted = newState;
            }
        });
    };

    render() {
        return (
            <div className='tracker-tab' style={{
                display: internalState.activeTabKey === 'tracker' ? 'block' : 'none'
            }}>
                <Empty
                    style={{display: this.isEmpty ? 'block' : 'none'}}
                    image={<img src={emptyImage} onDragStart={preventDrag} alt=''/>}
                    description={<span>{chrome.i18n.getMessage('noTracker')}</span>}
                />
                <div
                    className='tracker-list'
                    style={{display: !this.isEmpty ? 'block' : 'none'}}
                >
                    <Scrollbar>
                        <TrackerList/>
                    </Scrollbar>
                    <Button
                        className={
                            appState.get().trackerTabState.siteTrusted ? 'trust-site-btn-trusted' : ''
                        }
                        onClick={this.handleClick}
                    >
                        {
                            !appState.get().trackerTabState.siteTrusted ?
                            chrome.i18n.getMessage('trustSite') :
                            chrome.i18n.getMessage('distrustSite')
                        }
                    </Button>
                </div>
            </div>
        );
    }
}

@observer
class InfoSitesList extends React.Component {
    render() {
        return (
            <div className='info-sites-list'>
                <span>{chrome.i18n.getMessage('siteListHint')}</span>
            </div>
        );
    }
}

@observer
class SingleSite extends React.Component {
    handleClick = () => {
        chrome.runtime.sendMessage({
            src: 'popup',
            action: 'del cookie blacklist',
            data: {
                domain: this.props.domain
            }
        }, response => {
            if (response.result) {
                appState.get().manageTabState.listItems.remove(this.props.domain);
            }
        });
    };

    render() {
        return (
            <>
                <div className='single-site'>
                    <img src={getFaviconUrlByDomain(this.props.domain)} onDragStart={preventDrag} alt=''/>
                    <span>{this.props.domain}</span>
                </div>
                <div className='single-site-action'>
                    <a onClick={this.handleClick}>{chrome.i18n.getMessage('siteListRemove')}</a>
                </div>
            </>
        );
    }
}

@observer
class SitesList extends React.Component {
    render() {
        return (
            <List>
                {appState.get().manageTabState.listItems.map(domain => {
                    return (
                        <List.Item key={domain}>
                            <SingleSite domain={domain}/>
                        </List.Item>
                    );
                })}
            </List>
        );
    }
}

@observer
class AddSiteInput extends React.Component {
    handleChange = e => {
        internalState.inputText = e.target.value;
    };

    handleClick = () => {
        // ignore empty text
        if (internalState.inputText) {
            chrome.runtime.sendMessage({
                src: 'popup',
                action: 'add cookie blacklist',
                data: {
                    domain: internalState.inputText
                }
            }, response => {
                if (response.result) {
                    appState.get().manageTabState.listItems.push(internalState.inputText);
                } else {
                    internalState.inputPlaceholder = chrome.i18n.getMessage('siteListDomainExists');
                }
                internalState.inputText = '';
            });
        }
    }

    render() {
        return (
            <div className='add-site-input'>
                <Input
                    suffix={<img src={inputIcon} alt=''/>}
                    value={internalState.inputText}
                    placeholder={internalState.inputPlaceholder}
                    onChange={this.handleChange}
                />
                <span onClick={this.handleClick}>{chrome.i18n.getMessage('siteListAdd')}</span>
            </div>
        );
    }
}

@observer
class ManageTab extends React.Component {
    get isEmpty() {
        return appState.get().manageTabState.listItems.length <= 0;
    }

    render() {
        return (
            <div className='manage-tab' style={{
                display: internalState.activeTabKey === 'manage' ? 'block' : 'none'
            }}>
                <InfoSitesList/>
                <Empty
                    style={{display: this.isEmpty ? 'block' : 'none'}}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={chrome.i18n.getMessage('noSite')}
                />
                <div
                    className='sites-list'
                    style={{display: !this.isEmpty ? 'block' : 'none'}}
                >
                    <Scrollbar>
                        <SitesList/>
                    </Scrollbar>
                </div>
                <AddSiteInput/>
            </div>
        );
    }
}

@observer
class App extends React.Component {
    render() {
        return (
            <>
                <Header/>
                <MenuBar/>
                <HomeTab/>
                <TrackerTab/>
                <ManageTab/>
            </>
        );
    }
}

const internalState = observable({
    activeTabKey: 'home',
    inputText: '',
    inputPlaceholder: ''
});
const appState = observable.box({
    homeTabState: {
        url: '',
        // cookie switch state can be derived from home tab domain and manage tab list items
        trackerSwitchState: false
    },
    trackerTabState: {
        // badge number can be derived from tracker tab list items
        listItems: [],
        siteTrusted: false
    },
    manageTabState: {
        listItems: []
    }
});

// request config from background script
const queryConfig = async () => {
    const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({
            src: 'popup',
            action: 'query config'
        }, resolve);
    });
    appState.set(response.appState);
    prettyPrint(0, moduleName, 'Popup updated', {
        appState: toJS(appState.get())
    });
};
// immediately call to query initial config
queryConfig().then();
// update based on a fixed interval
setInterval(queryConfig, 2000);

ReactDOM.render(<App/>, document.getElementById('root'));
// TODO: fix home tab favicon missing issue, pass url instead of domain
// TODO: fix manage tab favicon missing issue, pass url instead of domain