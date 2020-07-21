import React, {createContext, useContext, useState} from 'react';
import ReactDOM from 'react-dom'
import {Switch} from 'antd';
import "antd/dist/antd.less";
import '../css/popup.less';
import headerIconOn from '../assets/images/hi-on.png';
import headerIconOff from '../assets/images/hi-off.png';

const StateContext = createContext({});
const UrlContext = createContext({});

const onDragStart = e => {
    e.preventDefault();
}

const Header = (props) => {

    const {toggleState} = useContext(StateContext);

    return (
        <div id={props.id}>
            <img src={toggleState ? headerIconOn : headerIconOff} onDragStart={onDragStart} alt=""/>
            <span>Alora</span>
        </div>
    )

};

const UrlDisplay = (props) => {

    const {faviconUrl, url} = useContext(UrlContext);

    return (
        <div id={props.id}>
            <img src={faviconUrl} onDragStart={onDragStart} alt=""/>
            <span>{url}</span>
        </div>
    )

}

const App = () => {
    const [toggleState, setToggleState] = useState(false);

    const onSwitchChange = checked => {
        setToggleState(checked);
    };

    return (
        <StateContext.Provider value={{toggleState, setToggleState}}>
            <div>
                <Header id="header"/>
                <div id="prefix">
                    <span>Lorem ipsum dolor sit amet.</span>
                </div>
                <UrlDisplay id="url"/>
                <div id="switch">
                    <Switch unCheckedChildren="OFF" checkedChildren="ON" onChange={onSwitchChange}/>
                </div>
                <div id="hint">
                    <div id="hintIcon">
                        <span>i</span>
                    </div>
                    <div id="hintText">
                        <span>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam porta nisl vel libero sagittis sodales.</span>
                    </div>
                </div>
            </div>
        </StateContext.Provider>
    )
}

new Promise(resolve => {
    resolve(0);
})
    .then(r => {
        ReactDOM.render(
            <UrlContext.Provider
                value={{faviconUrl: "chrome://favicon/https://www.openprocessing.org/", url: "www.openprocessing.org"}}>
                <App/>
            </UrlContext.Provider>,
            document.getElementById('root'));
    });