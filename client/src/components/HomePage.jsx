import React from "react";

function HomePage() {
  let NamInput = React.createRef();
  let NumInput = React.createRef();

  function handleClick() {
    if(NamInput.current.value===''||NumInput.current.value===''){
      alert("Please enter your name and student id.");
    }else{
      alert('Name:'+NamInput.current.value+'\nNumber:'+NumInput.current.value+'\nLogging in, Please wait ......');
      window.location.href = `/student/N/${NamInput.current.value.replaceAll(' ','')}/${NumInput.current.value.replaceAll(' ','')}`;
    }
  }

  return (
    <div>
      <h2>Welcome to Automatic Academic Career Planner!</h2>
      <label>Please enter your Student Name: </label> <input type="text" ref={NamInput} className="stdName"></input>
      <br></br>
      <label>Please enter your Student Number: </label> <input type="text" ref={NumInput} className="stdID"></input>
      <br></br>
      <button className="submitBtn" onClick={handleClick}>Submit</button>
    </div>
  );
}

export default HomePage;