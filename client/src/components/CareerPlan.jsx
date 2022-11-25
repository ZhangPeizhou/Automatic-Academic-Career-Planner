import React, {Fragment, useState, useEffect} from "react";
import "../styles/CareerPlan.css";

const CareerPlan = () => {
    const[plan, setPlan]=useState([]);

    const getPlan = async() => {
        try {
            const currentURL = window.location.pathname;
            const summer=currentURL.split('/')[2];
            const name=currentURL.split('/')[3];
            const id=currentURL.split('/')[4];
            const result = await fetch(`http://localhost:3001/student/${name}/${id}/${summer}`);
            const data = await result.json();
            setPlan(await data);
        }catch(err){console.error(err)}
    }

    function handleClick() {
        const currentURL = window.location.pathname;
        let summer=currentURL.split('/')[2];
        if(summer==="N"){summer="Y"}else{summer="N"}
        const name=currentURL.split('/')[3];
        const id=currentURL.split('/')[4];
        alert('Making new plan, Please wait ......');
        window.location.href = `/student/${summer}/${name}/${id}`;
    }

    function logOut() {      
        alert('Logging out ......');
        window.location.href = `/`;
    }

    function PlanTable(props){
        let expect_graduate=[parseInt(props.array[1]), parseInt(props.array[2])];
        let semesters;
        let planTable={};
        let courses = props.array[0];
        let majors = courses.majors;
        let electives = courses.free_electives.concat(courses.breadth_electives);
        let red=[];
        let blue=[];
        let green=[];
        majors.forEach(course=>{red.push(course)});
        courses.free_electives.forEach(course=>blue.push(course));
        courses.breadth_electives.forEach(course=>green.push(course));
        for(let i=0; i<majors.length; i++){
            majors.sort(function(a,b){return parseInt(a.split(" ")[1][0])-parseInt(b.split(" ")[1][0])});
        }
        for(let i=0; i<electives.length; i++){
            electives.sort(function(a,b){return parseInt(a.split(" ")[1])-parseInt(b.split(" ")[1])});
        }
        let summer=props.array[3];
        let today = new Date();
        if(!summer){
            if (today.getMonth() < 5) {
                //now is winter term
                if (expect_graduate[1] === 1) {
                    //student want to graduate on Janurary
                    semesters = 2 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 1;
                } else if (expect_graduate[1] === 5) {
                    //student want to graduate on May
                    semesters = 2 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear()));
                } else {
                    //student want to graduate on October
                    semesters = 2 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear()));
                }
            } else if (today.getMonth() < 8) {
                //now is summer term
                if (expect_graduate[1] === 1) {
                    semesters = 2 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 1;
                } else if (expect_graduate[1] === 5) {
                    semesters = 2 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear()));
                } else {
                    semesters = 2 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear()));
                }
            } else {
                //now is fall term
                if (expect_graduate[1] === 1) {
                    semesters = 2 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 2;
                } else if (expect_graduate[1] === 5) {
                    semesters = 2 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 1;
                } else {
                    semesters = 2 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 1;
                }
            }
        }else{
            if (today.getMonth() < 5) {
                //now is winter term
                if (expect_graduate[1] === 1) {
                    //student want to graduate on Janurary
                    semesters = 3 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 1;
                } else if (expect_graduate[1] === 5) {
                    //student want to graduate on May
                    semesters = 3 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear()));
                } else {
                    //student want to graduate on October
                    semesters = 3 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) + 1;
                }
            } else if (today.getMonth() < 8) {
                //now is summer term
                if (expect_graduate[1] === 1) {
                    semesters = 3 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 2;
                } else if (expect_graduate[1] === 5) {
                    semesters = 3 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 1;
                } else {
                    semesters = 3 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear()));
                }
            } else {
                //now is fall term
                if (expect_graduate[1] === 1) {
                    semesters = 3 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 3;
                } else if (expect_graduate[1] === 5) {
                    semesters = 3 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 2;
                } else {
                    semesters = 3 * (parseInt(expect_graduate[0]) - parseInt(today.getFullYear())) - 1;
                }
            }
        }
        console.log(semesters);
        console.log(summer)
        let currentYear = new Date().getFullYear();
        let currentMonth = new Date().getMonth();
        let currentSemester;
        if(currentMonth<5){currentSemester = "Winter"}
        else if(currentMonth>=5 && currentMonth<9){currentSemester = "Summer"}
        else{currentSemester = "Fall"}
        console.log(currentSemester)
        let planSemesters=[];
        let tempSemester;
        let tempYear;
        for(let i=0; i<semesters; i++){
            if(summer){
                const semesterNames=["Winter", "Summer", "Fall"];
                if(currentSemester === "Winter"){
                    tempSemester = semesterNames[(0+(i+1))%3];
                    tempYear = parseInt(currentYear)+Math.floor((i)/3);
                    planSemesters.push(`${tempSemester}, ${tempYear}`);
                }else if(currentSemester === "Summer"){
                    tempSemester = semesterNames[(1+(i+1))%3];
                    tempYear = parseInt(currentYear)+Math.floor((i+2)/3);
                    planSemesters.push(`${tempSemester}, ${tempYear}`);
                }else{
                    tempSemester = semesterNames[(2+(i+1))%3];
                    tempYear = parseInt(currentYear)+Math.floor((i+2)/3);
                    planSemesters.push(`${tempSemester}, ${tempYear}`);
                }
            }else{
                const semesterNames=["Winter", "Fall"];
                if(currentSemester === "Winter"){
                    tempSemester = semesterNames[(0+(i+1))%2];
                    tempYear = parseInt(currentYear)+Math.floor((i)/2);
                    planSemesters.push(`${tempSemester}, ${tempYear}`);
                }else{
                    tempSemester = semesterNames[(2+(i+1))%2];
                    tempYear = parseInt(currentYear)+Math.floor((i+1)/2);
                    planSemesters.push(`${tempSemester}, ${tempYear}`);
                }
            }

        }
        for(let i=0; i<2; i++){
            planSemesters.sort(function(a,b){
                if(a.split(", ")[1]!==b.split(", ")[1]){
                    return(a.split(", ")[1] - b.split(", ")[1])
                }else{
                    if(a.split(", ")[0] === "Winter"){
                        return(-1);
                    }else if(a.split(", ")[0] === "Fall"){
                        return(1)
                    }else{
                        if(b.split(", ")[0] === "Winter"){
                            return(1);
                        }else{
                            return(-1)
                        }
                    }
                }
            })
        }
        planSemesters.forEach(semester=>{planTable[semester]=[]})
        console.log(planTable)
        //the last term before graduate will not be arranged for electives because part time is allowed
        let remainSemester;
        if(summer){
            planTable[planSemesters[planSemesters.length-1]].push("| 4th year major courses (please plan it based on your own career plan) |");
            planTable[planSemesters[planSemesters.length-2]].push("| 4th year major courses (please plan it based on your own career plan) |");
            if(planSemesters[planSemesters.length-3].split(", ")[0] !== "Summer"){
                planTable[planSemesters[planSemesters.length-3]].push("| 4th year major courses (please plan it based on your own plan) |");
            }
            remainSemester = planSemesters.length-2;
        }else{
            planTable[planSemesters[planSemesters.length-1]].push("| 4th year major courses (please plan it based on your own career plan) |");
            planTable[planSemesters[planSemesters.length-2]].push("| 4th year major courses (please plan it based on your own career plan) |");
            remainSemester = planSemesters.length-1;
        }
        //the last 2 semester (4th year) will not be arranged
        let majorSemesters = -2;
        planSemesters.forEach(semester=>{
            if(!semester.includes("Summer")){majorSemesters++;}
        })
        let majorsPerSemester = Math.ceil(majors.length/majorSemesters);
        for(let i=0; i<planSemesters.length; i++){
            for(let j=0; j<majorsPerSemester; j++){
                if(majors.length>0){
                    if(!planSemesters[i].includes("Summer")){
                        console.log(planTable[planSemesters[i]])
                        planTable[planSemesters[i]].push(majors.shift());
                    }
                }
            }
        }
        let electivesPerSemester;
        console.log(planTable);
        if(!summer){
            if(Math.floor(electives.length/remainSemester)*remainSemester > electives.length){
                electivesPerSemester = Math.floor(electives.length/remainSemester);
            }else{
                electivesPerSemester = Math.ceil(electives.length/remainSemester);
            }
            Object.keys(planTable).forEach(semester=>{
                for(let i=0; i<electivesPerSemester; i++){
                    if(electives.length>0){
                        planTable[semester].push(electives.shift());
                    }
                }               
            })
        }else{
            //the summer of 4th year will not be arranged
            let numSummers=0;
            let otherSemesters = planSemesters.length;
            planSemesters.forEach(semester=>{
                if(semester.includes("Summer")){
                    numSummers++;
                    otherSemesters--;
                }
            })
            if(planSemesters[planSemesters.length-3].split(", ")[0] === "Summer"){
                otherSemesters-=2;
            }else{
                otherSemesters-=3;
                numSummers-=1;
            }
            console.log(numSummers);
            console.log(otherSemesters);
            if(3*numSummers >= electives.length){
                console.log("summer cover")
            }else{
                console.log("summer cannot cover")
                let numRemainElectives=electives.length - 3*numSummers;
                console.log(numRemainElectives);
                let electivesPerMajorSemester;
                if(3*numSummers + Math.floor(numRemainElectives/majorSemesters) >= planSemesters.length){
                    electivesPerMajorSemester = Math.floor(numRemainElectives/majorSemesters);
                }else{
                    electivesPerMajorSemester = Math.ceil(numRemainElectives/majorSemesters);
                }
                console.log(electivesPerMajorSemester);
                for(let i=0; i<planSemesters.length; i++){
                    if(electives.length>0){
                        if(planSemesters[i].split(", ")[0] === "Summer"){
                            for(let j=0; j<3; j++){
                                planTable[planSemesters[i]].push(electives.shift());
                            }
                        }else{
                            for(let j=0; j<electivesPerMajorSemester; j++){
                                planTable[planSemesters[i]].push(electives.shift());
                            }
                        }
                    }
                }
            }
        }
        return(
            <div>
                {/*summer?<h1>Y</h1>:<h1>N</h1>*/}
                <h1>Plan Table</h1>
                {Object.entries(planTable).map(([key, value]) => {return (<div><h4 id="semester">{key} : </h4>
                {value.map(course=> red.includes(course) ? <h4 id="majorCourse">| {course} |</h4> : 
                blue.includes(course) ? <h4 id="free_electiveCourse">| {course} |</h4> : 
                green.includes(course) ? <h4 id="breadth_electiveCourse">| {course} |</h4> 
                : <h4 id="other"><span>&nbsp;</span>{course}<span>&nbsp;</span></h4>)}</div>);})}
            </div>
        )
    }

    useEffect(() => {getPlan();}, []);
    console.log(plan);
    if(plan.exist==="N"){
        return(
            <div>
                <h1>Incorrect Name or Password</h1>
                <a href='http://localhost:3000'>Try again</a>
            </div>
        )
    }else if(plan.exist==="Y"){
        return (
            <Fragment>
                <label>Student Name:<span>&nbsp;</span></label>
                <label>{plan.student_name}</label>
                <br></br>
                <label>Student ID:<span>&nbsp;</span></label>
                <label>{plan.student_id}</label>
                <br></br>
                <label>Major:<span>&nbsp;</span></label>
                <label><span>&nbsp;</span>{plan.major}<span>&nbsp;</span></label>
                <br></br>
                <label>Minor(s):<span>&nbsp;</span></label>
                {plan.minor1==="N" ? null : <label>|<span>&nbsp;</span>{plan.minor1}<span>&nbsp;</span>|</label>}
                {plan.minor2==="N" ? null : <label>|<span>&nbsp;</span>{plan.minor2}<span>&nbsp;</span>|</label>}
                <br></br>
                <label>Interests:<span>&nbsp;</span></label>
                <label>|<span>&nbsp;</span>{plan.interest1}<span>&nbsp;</span>|</label>
                <label>|<span>&nbsp;</span>{plan.interest2}<span>&nbsp;</span>|</label>
                <label>|<span>&nbsp;</span>{plan.interest3}<span>&nbsp;</span>|</label>
                <label>|<span>&nbsp;</span>{plan.interest4}<span>&nbsp;</span>|</label>
                <br></br>
                <label>Total Credit:<span>&nbsp;</span></label>
                <label>{plan.tot_credit}</label>
                <br></br>
                <label>Expected Graduate Time:<span>&nbsp;</span></label>
                {plan.grad_month===1 ? <label>January 15th,<span>&nbsp;</span>{plan.grad_year}</label> : 
                plan.grad_month===5 ? <label>May 15th,<span>&nbsp;</span>{plan.grad_year}</label> :
                <label>October 1st,<span>&nbsp;</span>{plan.grad_year}</label>}
                <br></br>
                <label>Grades:<span>&nbsp;</span></label>
                <label>{plan.grade}</label>
                <br></br>
                <div>{plan.plan.warning.length<=0 ? '' : <h2 style={{'color': 'red'}}>WARNING: {plan.plan.warning}</h2>}</div>
                <div><h3 id='major'>Major Courses (must take): </h3>{plan.plan.majors.map(course=>course===plan.plan.majors[0] ? 
                <lable> {course}</lable> : <lable>, {course}</lable>)}</div>
                <div><h3 id='free_elective'>Free Elective Courses ({plan.plan.remain_free} credits remain): </h3>
                {plan.plan.free_electives.map(course=>course===plan.plan.free_electives[0] ? <lable> {course}</lable>
                : <lable>, {course}</lable>)}</div>
                <div><h3 id='breadth_elective'>Breadth Elective Courses ({plan.plan.remain_breadth} credits remain): </h3>
                {plan.plan.breadth_electives.map(course=>course===plan.plan.breadth_electives[0] ? <lable> {course}</lable>
                : <lable>, {course}</lable>)}</div>
                <div><h3 id='free_elective'>All Free Elective Courses Based on your Interests: ({plan.plan.all_free_electives.length} in total)</h3>
                {plan.plan.all_free_electives.map(course=>course===plan.plan.all_free_electives[0] ? <lable> {course}</lable>
                : <lable>, {course}</lable>)}</div>
                <div><lable style={{'color': 'red'}}>(ATTENTION: courses with * mark have prereq course(s), please check carefully before registration )</lable></div>
                <div><h3 id='breadth_elective'>All Breadth Elective Courses Based on your Interests: ({plan.plan.all_breadth_electives.length} in total)</h3>
                {plan.plan.all_breadth_electives.map(course=>course===plan.plan.all_breadth_electives[0] ? <lable> {course}</lable>
                : <lable>, {course}</lable>)}</div>
                <div><lable style={{'color': 'red'}}>(ATTENTION: courses with * mark have prereq course(s), please check carefully before registration )</lable></div>
                <PlanTable array={[plan.plan, plan.grad_year, plan.grad_month, plan.summer]}/>
                <div><h2>Additional Requirements: </h2>
                {plan.plan.additional_req.map(course=>course===plan.plan.additional_req[0] ? <lable>- {course}</lable>
                : <div>- {course}</div>)}</div>
                {plan.summer?<button onClick={handleClick}>Plan without Summer Terms</button>:<button onClick={handleClick}>Plan with Summer Terms</button>}
                <button onClick={logOut} id='logOut'>Logout</button>
            </Fragment>
        );
    }else{
        return(
            <div>
                <h1>Loading...</h1>
            </div>
        )
    }
    
}

export default CareerPlan;