import 'react-app-polyfill/ie11';
import React, { memo } from 'react';
import ReactDOM from 'react-dom';
import { useReaction, useSignal } from '../.';

let cot = 1;

const Counter = ({ onChange  }: any) => {
  console.log('render=====zk')
  return (
    <div onClick={() => onChange(++cot)}>add</div>
  )
};

const Reader = ({ read }: any) => {
  const counter = useReaction(() => read());
  return (
    <div>{counter}</div>
  )
}

const App = () => {
  const [read, write] = useSignal(1);
  return (
    <div>
     <Reader read={read}/>
     <Counter onChange={write}/>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
