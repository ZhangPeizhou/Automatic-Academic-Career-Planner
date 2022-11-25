import React from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from './components/HomePage';
import Error from './components/Error';
import CareerPlan from './components/CareerPlan'
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
if(window.location.pathname==='/'){
  root.render(
    <div>
      <HomePage />
    </div>
  );
}else if(window.location.pathname.startsWith('/student/')){
  root.render(
    <div>
      <CareerPlan />
    </div>
  );
}else{
  root.render(
    <div>
      <Error />
    </div>
  );
}

reportWebVitals();
