import ReactDOM from 'react-dom';
import { MaxUI } from '@maxhub/max-ui';
import '@maxhub/max-ui/dist/styles.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <MaxUI>
        <App />
  </MaxUI>,
  document.getElementById('root')
);

reportWebVitals();