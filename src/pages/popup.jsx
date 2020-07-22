import React from 'react';
import ReactDOM from 'react-dom'
import {Switch} from 'antd';
import "antd/dist/antd.less";
import '../css/popup.less';
import headerIconOn from '../assets/images/hi-on.png';
import headerIconOff from '../assets/images/hi-off.png';
import baIconOn from '../assets/images/ba-on.png';
import baIconOff from '../assets/images/ba-off.png';

class PopupCache {
    constructor(domain, blacklist, config) {
        this.domain = domain;
        this.blacklist = blacklist;
        this.config = config;
    }
}

function generateRequest(reqType, args) {
    switch (reqType) {
        case "query":
            return {reqType: reqType, keys: args};
        case "update":
            return {reqType: reqType, config: popupCache.config, blacklist: Array.from(popupCache.blacklist)};
    }
}

let popupCache;

const onDragStart = e => {
    e.preventDefault();
}

const Header = (props) => {

    return (
        <div id={props.id}>
            <img src={props.enabled ? headerIconOn : headerIconOff} onDragStart={onDragStart} alt=""/>
            <span>Alora</span>
        </div>
    )

};

const UrlDisplay = (props) => {

    return (
        <div id={props.id}>
            <img src={props.faviconUrl} onDragStart={onDragStart} alt=""/>
            <span>{props.url}</span>
        </div>
    )

}

class App extends React.Component {

    #port;

    constructor(props) {
        super(props);
        this.state = {
            enabled: false,
            faviconUrl: '',
            url: ''
        };

        this.onSwitchChange = this.onSwitchChange.bind(this);
    }

    onSwitchChange(checked) {
        this.setState({enabled: checked});
        // save change
        if (checked) {
            popupCache.blacklist.add(popupCache.domain);
        } else {
            popupCache.blacklist.delete(popupCache.domain);
        }
        this.#port.postMessage(generateRequest("update"));
    };

    componentDidMount() {
        // only invoke after first rendering
        console.log('mount');
        this.#port = chrome.runtime.connect({name: "popup"});
        this.#port.onMessage.addListener(msg => {
            if (msg.resType === "query") {
                let blacklist = new Set(msg.values.blacklist);
                let domainName = msg.domainName;
                popupCache = new PopupCache(domainName, blacklist, msg.values.config);
                // set state
                this.setState({
                    enabled: popupCache.blacklist.has(popupCache.domain),
                    url: popupCache.domain
                });
            }
        });
        this.#port.postMessage(generateRequest("query", ["config", "blacklist"]));
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            let currTab = tabs[0];
            if (currTab) {
                this.setState({
                    faviconUrl: "chrome://favicon/size/24@1x/" + currTab.url
                });
            }
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // invoke after updating, will not invoke on initialization
        console.log('update');
        chrome.browserAction.setIcon({path: this.state.enabled ? baIconOn : baIconOff});
    }

    render() {

        return (
            <div>
                <Header id="header" enabled={this.state.enabled}/>
                <div id="prefix">
                    <span>{chrome.i18n.getMessage("popup_block")}</span>
                </div>
                <UrlDisplay id="url" faviconUrl={this.state.faviconUrl} url={this.state.url}/>
                <div id="switch">
                    <Switch unCheckedChildren="OFF" checkedChildren="ON" checked={this.state.enabled}
                            onChange={this.onSwitchChange}/>
                </div>
                <div id="hint">
                    <div id="hintIcon">
                        <span>i</span>
                    </div>
                    <div id="hintText">
                        <span>{chrome.i18n.getMessage("popup_explanation")}</span>
                    </div>
                </div>
            </div>
        )

    }

}

ReactDOM.render(<App/>, document.getElementById('root'));