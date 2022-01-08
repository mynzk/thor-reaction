import 'react-app-polyfill/ie11';
import React, { memo } from 'react';
import ReactDOM from 'react-dom';
import { useReaction, useSignal } from '../.';

const Counter = ({ onChange  }: any) => {
  return (
    <div onClick={() => onChange(c => c + 1)}>add</div>
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
