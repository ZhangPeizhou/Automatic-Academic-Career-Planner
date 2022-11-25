const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();
const cors = require("cors");
const {Client} = require('pg'); 
const client = new Client({
    user: "postgres",
    password: "ZhangPeizhou",
    host: "localhost",
    port: 5432,
    database: "4905Project"
})
const session = require('express-session');
app.use(session({
    secret: 'some secret key here',
    resave: true,
    saveUninitialized: false,
    cookie: {},
    login: false
}));

//middleware
app.use(cors());
app.use(express.json());

//start server
client.connect()
.then(() => console.log("*************** Connected Sucessfully ***************"))
.then(() => {
    //homepage
    app.get("/", (req, res) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.send();
    });
    //login
    app.get('/student/:name/:id/:summerTerm', async (req, res) => {
        try {
            let name = req.params.name;
            let id = req.params.id;
            let summerTerm = req.params.summerTerm;
            console.log(name, id, summerTerm)
            client.query(`SELECT * FROM "Students" WHERE student_name='${name}' AND student_id=${id}`)
            .then(result => {
                if (result.rows.length === 0) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.send(JSON.stringify({
                        exist: "N"
                    }));
                } else {
                    req.session.student_id = id;
                    req.session.student_name = name;
                    req.session.tot_credit = result.rows[0].tot_credit;
                    req.major = result.rows[0].major;
                    req.minors = result.rows[0].minors;
                    req.interests = result.rows[0].breadth_interests + result.rows[0].free_interests;
                    req.grades = result.rows[0].grades;
                    req.session.login = true;
                    res.session = req.session;
                    res.statusCode = 200;
                    let data = result.rows[0];
                    data.exist = "Y";
                    data.grad_year = result.rows[0].expect_graduate[0];
                    data.grad_month = result.rows[0].expect_graduate[1];
                    data.major = result.rows[0].major;
                    data.minor1 = result.rows[0].minors[0];
                    data.minor2 = result.rows[0].minors[1];
                    data.interest1 = result.rows[0].breadth_interests[0];
                    data.interest2 = result.rows[0].breadth_interests[1];
                    data.interest3 = result.rows[0].free_interests[0];
                    data.interest4 = result.rows[0].free_interests[1];
                    if(summerTerm === "N"){
                        data.summer = false;
                    }else{
                        data.summer = true;
                    }
                    let text = "";
                    result.rows[0].grades.map((grade) => {
                        text = text + "| " + grade[0] + " " + grade[1] + " |";
                    });
                    data.grade = text;
                    makePlan(result.rows[0], res, data);
                }
            })
        } catch (err) {
            console.log(err.message);
        }
    })

    app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
    });
})
.catch(err => console.log(err))

//check if the grade of a course satisfies the requirement
function gradSatisfied(grade, requirement){
    const grades=['WTH','F','*','D-','D','D+','C-','C','C+','B-','B','B+','A-','A','A+','IP'];
    const courseGrade=grades.indexOf(grade.split('/')[1]);
    const requireGrade=grades.indexOf(requirement.split('/')[1]);
    if(courseGrade>=requireGrade){
        return true;
    }else{
        return false;
    }
}
//check if user took this course and if the grade satisfies the requirement
function checkCourse(course, grades, requirement){
    for(let i=0;i<grades.length;i++){
        if(course===grades[i][0]){
            console.log('grade: '+grades[i]);
            if(gradSatisfied((grades[i][0]+'/'+grades[i][1]).toString(), requirement)){
                console.log('course: '+course+', requirement: '+requirement+'grade: '+grades[i][1]+', satisfied: true');
                return true;
            }
        }
    }
    return false;
} 

//make plan
async function makePlan(user, response, data){
    let x = []; //array of must-take courses
    let plan = {}; //career plan object
    let elective_plan=[]; //array of all elective courses
    let free_elective_plan=[]; //array of all possible free elective courses based on interests
    let breadth_elective_plan=[]; //array of all possible breadth elective courses based on interests
    let free_elective=[]; //array of recommended free elective courses
    let breadth_elective=[]; //array of recommended breadth elective courses
    let must_take = []; //array of must-take courses
    let already_taken = []; //array of already taken courses
    let should_take = []; //array of must-take courses that should be taken
    let warning = []; //array of warning messages
    let additional_req; //additional requirements      
    //record all already-token courses (only record already-passed courses (grade > F) or still in progress (IP))
    for (let i = 0; i < Object.keys(user.grades).length - 1; i++) {
        console.log((user.grades[i][0]+"/"+user.grades[i][1]).toString());
        console.log((user.grades[i][0]+'/*').toString());
        console.log(gradSatisfied((user.grades[i][0]+"/"+user.grades[i][1]).toString(), (user.grades[i][0]+'/*').toString()))
        if(gradSatisfied((user.grades[i][0]+"/"+user.grades[i][1]).toString(), (user.grades[i][0]+'/*').toString())){
            already_taken[i] = user.grades[i][0];
        }
    }
    console.log(user.grades);
    //arrange plan for major
    let department;
    client.query(`SELECT * FROM "Programs" WHERE prog_name='${user.major}'`)
    .then(res => {
        additional_req = res.rows[0].additional_req;
        department = res.rows[0].department.split('/')[1];
        additional_req=res.rows[0].additional_req;
        console.log(department);
        //get all must-take courses
        must_take = res.rows[0].must_take;
        //'must-take' - 'already-taken' = 'should-take'
        must_take.forEach(course => {
            if (already_taken.includes(course) === false) {
                should_take.push(course);
            }
        });
        //start making plan - start from first year courses, then move to advanced courses
        should_take.sort((a, b)=>a.split(" ")[1] - b.split(" ")[1]);
        console.log("already taken: "+already_taken);
        console.log("should_take: "+should_take);
        should_take.forEach(course=>{
            client.query(`SELECT * FROM "Corses" WHERE course_name='${course}'`)
            .then(result=>{
                let lecture=result.rows[0];
                //have no prereq course
                if(lecture.prereq===null){
                    console.log("---------------------")
                    console.log("no prereq");
                    x.push(lecture.course_name);
                    console.log("take course: "+lecture.course_name)
                //have prereq course
                }else{
                    //only 1 prereq
                    if(lecture.prereq.length===1){
                        console.log("---------------------")
                        console.log("only 1 prereq")
                        //have alternative prereq courses
                        if(lecture.prereq[0].toString().includes("|or|")){
                            console.log("has alternative")
                            let alternatives=lecture.prereq.toString().split("|or|");
                            let qualified=false;
                            for(let i=0; i<alternatives.length; i++){
                                if((already_taken.includes(alternatives[i].toString().split('/')[0]) &&
                                checkCourse(alternatives[i].toString().split('/')[0], user.grades, alternatives[i].toString())) || 
                                x.includes(alternatives[i].toString().split('/')[0])){
                                    qualified=true;
                                    break;
                                }
                            }
                            if(qualified){
                                x.push(lecture.course_name);
                                console.log("take course: "+lecture.course_name)
                            }else{
                                for(let i=0; i<alternatives.length; i++){
                                    if(should_take.includes(alternatives[i].toString().split('/')[0])){
                                        x.push(alternatives[i].split('/')[0]);
                                        console.log("take prereq: "+alternatives[i].toString().split('/')[0])
                                        break;
                                    }
                                }
                                x.push(lecture.course_name);
                                console.log("take course: "+lecture.course_name)
                            }
                        //only 1 prereq, no alternative prereq courses
                        }else{
                            console.log("no alternative")
                            console.log(checkCourse(lecture.prereq[0].toString().split('/')[0], user.grades, lecture.prereq[0].toString()))
                            if((already_taken.includes(lecture.prereq[0].toString().split('/')[0])===false && 
                            x.includes(lecture.prereq[0].toString().split('/')[0])===false) ||
                            !checkCourse(lecture.prereq[0].toString().split('/')[0], user.grades, lecture.prereq[0].toString())){
                                x.push(lecture.prereq[0].toString().split('/')[0]);
                                console.log("take prereq lecture: "+lecture.prereq[0].toString().split('/')[0])
                                x.push(lecture.course_name);
                                console.log("take course: "+lecture.course_name)
                            }else{
                                x.push(lecture.course_name);
                                console.log("take course: "+lecture.course_name)
                            }
                        }
                    //more than 1 prereq
                    }else{
                        console.log("---------------------")
                        console.log("more than 1 prereq")
                        let prereq_s=[];
                        for(let i=0; i<lecture.prereq.length; i++){
                            prereq_s.push(lecture.prereq[i].toString())
                        }
                        let qualified=0;
                        for(let i=0; i<prereq_s.length; i++){
                            //this prereq has alternative
                            if(prereq_s[i].includes("|or|")){
                                console.log("has alternative for this prereq")
                                let alternatives=prereq_s[i].split("|or|");
                                for(let j=0; j<alternatives.length; j++){
                                    if(already_taken.includes(alternatives[j].split('/')[0]) ||
                                    x.includes(alternatives[j].split('/')[0])){
                                        if(checkCourse(alternatives[j].toString().split('/')[0], user.grades, alternatives[j].toString())){
                                            qualified++;
                                            break;
                                        }
                                    }
                                }
                            //this prereq does not have alternative
                            }else{
                                if((already_taken.includes(prereq_s[i].split('/')[0]) && 
                                checkCourse(prereq_s[i].split('/')[0], user.grades, prereq_s[i]))||
                                x.includes(prereq_s[i].split('/')[0])){
                                    qualified++;
                                }
                            }
                        }
                        if(qualified==prereq_s.length){
                            console.log("already complete all prereq courses")
                            x.push(lecture.course_name);
                            console.log("take course: "+lecture.course_name)
                        }else{
                            for(let i=0; i<prereq_s.length; i++){
                                if(prereq_s[i].includes("|or|")){
                                    let alternatives=prereq_s[i].split("|or|");
                                    let atLeastOneQualified=false;
                                    for(let j=0; j<alternatives.length; j++){
                                        if((already_taken.includes(alternatives[j].split('/')[0]) &&
                                        checkCourse(alternatives[j].split('/')[0], user.grades, alternatives[j])) ||
                                        x.includes(alternatives[j].split('/')[0])){
                                            atLeastOneQualified=true;
                                            qualified++;
                                            break;
                                        }
                                    }
                                    if(!atLeastOneQualified){
                                        for(let j=0; j<alternatives.length; j++){
                                            if(should_take.includes(alternatives[j].split('/')[0])){
                                                x.push(alternatives[j].split('/')[0]);
                                                console.log("take prereq: "+alternatives[j].split('/')[0])
                                                break;
                                            }
                                        }
                                    }
                                }else{
                                    if(already_taken.includes(prereq_s[i].split('/')[0])===false &&
                                        x.includes(prereq_s[i].split('/')[0])===false){
                                            x.push(prereq_s[i].split('/')[0]);
                                            console.log("take prereq: "+prereq_s[i].split('/')[0])
                                            qualified++;
                                        }
                                }
                            }
                            if(qualified>=prereq_s.length){
                                console.log("already complete all prereq courses")
                                x.push(lecture.course_name);
                                console.log("take course: "+lecture.course_name)
                            }
                        }
                    }
                }
            })
        })            
    })
    setTimeout(() => {
        let already_taken_electives=[];
        //courses of these faculties are considered breadth electives
        const breadth_elective_faculties = ["Art", "Social Science", "Business", "Science", "Public Affairs",
         "Computer Science", "Math and Statistics", "Engineering and Design"];
        already_taken.forEach(course=>{
            if(!must_take.includes(course)){
                already_taken_electives.push(course);
            }
        })
        x.forEach(course=>{
            if(!must_take.includes(course)){
                already_taken_electives.push(course);
            }
        })
        let remain_free_elective_credits;
        let remain_breadth_elective_credits;
        client.query(`SELECT * From "Programs" WHERE prog_name = '${user.major}'`)
        .then(result=>{
            remain_free_elective_credits = result.rows[0].free_elective;
            console.log('----------------------------------------------------------')
            console.log(`fe: ${remain_free_elective_credits}`);
            remain_breadth_elective_credits = result.rows[0].breadth_elective;
            console.log(`be: ${remain_breadth_elective_credits}`)
            //check how many credits of free/breadth electives should the user actually take
            if(already_taken_electives.length > 0){
                already_taken_electives.forEach(course=>{
                    client.query(`SELECT * FROM "Corses" WHERE course_name = '${course}'`)
                    .then((res)=>{
                        if(breadth_elective_faculties.includes(res.rows[0].department)){
                            remain_breadth_elective_credits = remain_breadth_elective_credits - res.rows[0].credit;
                        }else{
                            remain_free_elective_credits = remain_free_elective_credits - res.rows[0].credit;
                        }
                    })
                })
            }
            //wait for a second to get actual remain_free/breadth electives
            setTimeout(()=>{
                console.log(`remain fe: ${remain_free_elective_credits}`);
                console.log(`remain be: ${remain_breadth_elective_credits}`);
                //plan.remain_free and plan.remain_breadth are for display purposes on the client side, no use in the server side
                plan.remain_free=0;
                plan.remain_breadth=0;
                while(plan.remain_free<remain_free_elective_credits){plan.remain_free+=0.5;}
                while(plan.remain_breadth<remain_breadth_elective_credits){plan.remain_breadth+=0.5;}
                //select courses for breadth electives based on breadth_interests
                //save all course info in array instead of just course name to reduce the times of query
                if(remain_breadth_elective_credits > 0){
                    client.query(`SELECT * FROM "Corses" WHERE department = '${user.breadth_interests[0]}'`)
                    .then(result1=>{
                        result1.rows.forEach(course=>{
                            if(course.course_name.split(" ")[1].startsWith('1') || course.course_name.split(" ")[1].startsWith('2')){
                                breadth_elective.push(course);
                            }
                        })
                        client.query(`SELECT * FROM "Corses" WHERE department = '${user.breadth_interests[1]}'`)
                        .then(result2=>{
                            result2.rows.forEach(course=>{
                                if(course.course_name.split(" ")[1].startsWith('1') || course.course_name.split(" ")[1].startsWith('2')){
                                    breadth_elective.push(course);
                                }
                            })
                            //do not take this course if already have
                            for(let i=breadth_elective.length-1; i>=0; i--){
                                if(already_taken.includes(breadth_elective[i].course_name) || x.includes(breadth_elective[i].course_name) 
                                || already_taken_electives.includes(breadth_elective[i].course_name)){
                                    breadth_elective.splice(i, 1);
                                }
                            }
                            //do not take this course if already have preclude course
                            for(let i=breadth_elective.length-1; i>=0; i--){
                                if(breadth_elective[i].preclude!==null){
                                    for(let j=0; j<breadth_elective[i].preclude.length; j++){
                                        if(already_taken.includes(breadth_elective[i].preclude[j]) 
                                        || breadth_elective.includes(breadth_elective[i].preclude[j])
                                        || x.includes(breadth_elective[i].preclude[j]) 
                                        || already_taken_electives.includes(breadth_elective[i].preclude[j])){
                                            breadth_elective.splice(i,1)
                                        }
                                    }
                                }
                            }
                            //2 year courses with no prereq is prefered
                            breadth_elective.forEach(course=>{
                                if(course.course_name.split(' ')[1].startsWith('2') && course.prereq===null){
                                    if(remain_breadth_elective_credits-course.credit>=0){
                                        elective_plan.push(course.course_name);
                                        breadth_elective_plan.push(course.course_name);
                                        remain_breadth_elective_credits-=course.credit;
                                    }
                                }
                            })
                            //console.log(breadth_elective); 
                            console.log(remain_breadth_elective_credits);
                        })
                    })
                }
                //select courses for free electives based on free_interests
                if(remain_free_elective_credits > 0){
                    client.query(`SELECT * FROM "Corses" WHERE department = '${user.free_interests[0]}'`)
                    .then(result1=>{
                        result1.rows.forEach(course=>{
                            if(course.course_name.split(" ")[1].startsWith('1') || course.course_name.split(" ")[1].startsWith('2')){
                                free_elective.push(course);
                            }
                        })
                        client.query(`SELECT * FROM "Corses" WHERE department = '${user.free_interests[1]}'`)
                        .then(result2=>{
                            result2.rows.forEach(course=>{
                                if(course.course_name.split(" ")[1].startsWith('1') || course.course_name.split(" ")[1].startsWith('2')){
                                    free_elective.push(course);
                                }
                            })
                            //do not take this course if already have
                            for(let i=free_elective.length-1; i>=0; i--){
                                if(already_taken.includes(free_elective[i].course_name) || x.includes(free_elective[i].course_name) ||
                                already_taken_electives.includes(free_elective[i].course_name)){
                                    free_elective.splice(i, 1);
                                }
                            }
                            //do not take this course if already have preclude course
                            for(let i=free_elective.length-1; i>=0; i--){
                                if(free_elective[i].preclude!==null){
                                    let preclude_length=free_elective[i].preclude.length;
                                    for(let j=0; j<preclude_length; j++){
                                        if(already_taken.includes(free_elective[i].preclude[j]) 
                                        || free_elective.includes(free_elective[i].preclude[j])
                                        || x.includes(free_elective[i].preclude[j]) 
                                        || already_taken_electives.includes(free_elective[i].preclude[j])){
                                            free_elective.splice(i,1)
                                        }
                                    }
                                }
                            }
                            //2 year courses with no prereq is prefered
                            free_elective.forEach(course=>{
                                if(course.course_name.split(' ')[1].startsWith('2') && course.prereq===null){
                                    if(remain_free_elective_credits-course.credit>=0){
                                        elective_plan.push(course.course_name);
                                        free_elective_plan.push(course.course_name);
                                        remain_free_elective_credits-=course.credit;
                                    }
                                }
                            })
                            //console.log(free_elective); 
                            console.log(remain_free_elective_credits);
                        })
                    })
                }
            }, 100)
            //plan elective courses
            setTimeout(()=>{
                //calculate how many 1st year courses left
                let first_year_credits=parseFloat(0);
                already_taken.forEach(course=>{
                    if(course.split(' ')[1].startsWith('1')){
                        client.query(`SELECT * FROM "Corses" WHERE course_name = '${course}'`)
                        .then(result=>{first_year_credits+=parseFloat(result.rows[0].credit);})
                    }
                })
                x.forEach(course=>{
                    if(course.split(' ')[1].startsWith('1')){
                        client.query(`SELECT * FROM "Corses" WHERE course_name = '${course}'`)
                        .then(result=>{first_year_credits+=parseFloat(result.rows[0].credit);})
                    }
                })
                elective_plan.forEach(course=>{
                    if(course.split(' ')[1].startsWith('1')){
                        client.query(`SELECT * FROM "Corses" WHERE course_name = '${course}'`)
                        .then(result=>{first_year_credits+=parseFloat(result.rows[0].credit);})
                    }
                })
                setTimeout(() => {
                    console.log('1 year credits: '+first_year_credits);
                    //if 1st year credits <=7 (allowed)
                    if(first_year_credits <=7){
                        if(remain_breadth_elective_credits>0){
                            //based on calculation, repeat for 5 times will cover all target courses
                            for(let x=0; x<6; x++){
                                breadth_elective.forEach(course=>{
                                    let target=false;
                                    //if we already have the prereq course of a course, we will consider this course as a primary target course to take
                                    /*here we only consider courses with one prereq, since usually courses with more than one prereq are difficult, and
                                    we have so many options, so we will not take them*/
                                    if(course.prereq!==null){
                                        if(course.prereq.length===1){
                                            //if no alternative prereq
                                            if(course.prereq.includes('|or|')===false){
                                                if((already_taken.includes(course.prereq[0][0].split('/')[0]) && checkCourse(course.prereq[0][0].split('/')[0], user.grades, course.prereq[0][0]))
                                                || x.includes(course.prereq[0][0].split('/')[0])
                                                || elective_plan.includes(course.prereq[0][0].split('/')[0])){
                                                    target=true;
                                                }
                                            }else{
                                            //have alternative prereq
                                                let alternative_length=course.prereq.split('|or|').length;
                                                for(let i=0; i<alternative_length; i++){
                                                    if((already_taken.includes(course.prereq[0][0].split('|or|')[i].split('/')[0]) && 
                                                    checkCourse(course.prereq[0][0].split('|or|')[i].split('/')[0], user.grades, course.prereq[0][0].split('|or|')[i]))
                                                    || x.includes(course.prereq[0][0].split('|or|')[i].split('/')[0])
                                                    || elective_plan.includes(course.prereq[0][0].split('|or|')[i].split('/')[0])){
                                                        target=true;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if(target){
                                        elective_plan.push(course.course_name);
                                        breadth_elective_plan.push(course.course_name);
                                        remain_breadth_elective_credits-=course.credit;
                                        breadth_elective.splice(breadth_elective.indexOf(course), 1);
                                        if(course.course_name.split(' ')[1].startsWith('1')){
                                            first_year_credits+=course.credit;
                                        }
                                    }
                                })
                            }
                            if(remain_free_elective_credits>0){
                                //based on calculation, repeat for 5 times will cover all target courses
                                for(let k=0; k<6; k++){
                                    free_elective.forEach(course=>{
                                        let target=false;
                                        //if we already have the prereq course of a course, we will consider this course as a primary target course to take
                                        /*here we only consider courses with one prereq, since usually courses with more than one prereq are difficult, and
                                        we have so many options, so we will not take them*/
                                        if(course.prereq!==null){
                                            if(course.prereq.length===1){
                                                //if no alternative prereq
                                                if(course.prereq.includes('|or|')===false){
                                                    if((already_taken.includes(course.prereq[0][0].split('/')[0]) && 
                                                    checkCourse(course.prereq[0][0].split('/')[0], user.grades, course.prereq[0][0]))
                                                    || x.includes(course.prereq[0][0].split('/')[0])
                                                    || elective_plan.includes(course.prereq[0][0].split('/')[0])){
                                                        target=true;
                                                    }
                                                }else{
                                                //have alternative prereq
                                                    let alternative_length=course.prereq.split('|or|').length;
                                                    for(let i=0; i<alternative_length; i++){
                                                        if((already_taken.includes(course.prereq[0][0].split('|or|')[i].split('/')[0]) && 
                                                        checkCourse(course.prereq[0][0].split('|or|')[i].split('/')[0], user.grades, course.prereq[0][0].split('|or|')[i]))
                                                        || x.includes(course.prereq[0][0].split('|or|')[i].split('/')[0])
                                                        || elective_plan.includes(course.prereq[0][0].split('|or|')[i].split('/')[0])){
                                                            target=true;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if(target){
                                            elective_plan.push(course.course_name);
                                            free_elective_plan.push(course.course_name);
                                            remain_free_elective_credits-=course.credit;
                                            free_elective.splice(free_elective.indexOf(course), 1);
                                            if(course.course_name.split(' ')[1].startsWith('1')){
                                                first_year_credits+=course.credit;
                                            }
                                        }
                                    })
                                }
                            }
                            //after cover target courses, the rest elective courses will be selected randomly
                            while(remain_breadth_elective_credits>0 && breadth_elective.length>0){
                                let random_index=Math.floor(Math.random()*breadth_elective.length);
                                if(!(elective_plan.includes(breadth_elective[random_index]) ||  
                                already_taken.includes(breadth_elective[random_index]) || 
                                x.includes(breadth_elective[random_index]))){
                                    if(breadth_elective[random_index].prereq === null){
                                        elective_plan.push(breadth_elective[random_index].course_name);
                                        breadth_elective_plan.push(breadth_elective[random_index].course_name);
                                    }
                                }
                                remain_breadth_elective_credits-=breadth_elective[random_index].credit;
                                breadth_elective.splice(random_index, 1);
                            }
                            while(remain_free_elective_credits>0 && free_elective.length>0){
                                let random_index=Math.floor(Math.random()*free_elective.length);
                                if(!(elective_plan.includes(breadth_elective[random_index]) ||  
                                already_taken.includes(breadth_elective[random_index]) || 
                                x.includes(breadth_elective[random_index]))){
                                    if(free_elective[random_index].prereq === null){
                                        elective_plan.push(free_elective[random_index].course_name);
                                        free_elective_plan.push(breadth_elective[random_index].course_name);
                                    }
                                }
                                remain_free_elective_credits-=free_elective[random_index].credit;
                                free_elective.splice(random_index, 1);                                
                            }
                            console.log('remain B: '+remain_breadth_elective_credits)
                            console.log('remain F: '+remain_free_elective_credits)
                        }
                    }else{
                    //1st year credits >7 (some credits will be wasted)
                        warning.push("1st year credits >7, some credits will be wasted, please contact registration office for more advice");
                    }
                }, 1000);
            }, 100);
        })
    },2000)
    
   
    setTimeout(() => {
        console.log("///////////////////////All courses taken///////////////////////")
        console.log(`return plan: ${x}`);
        data.plan = plan;
        plan.majors = x;
        plan.free_electives = free_elective_plan;
        plan.breadth_electives = breadth_elective_plan;
        plan.additional_req = additional_req;
        plan.warning = warning;
        plan.all_free_electives = [];
        free_elective.forEach(course=>{
            if(course.prereq!==null){
                plan.all_free_electives.push(course.course_name+'*');
            }else{
                plan.all_free_electives.push(course.course_name);
            }
        });
        plan.all_breadth_electives = [];
        breadth_elective.forEach(course=>{
            if(course.prereq!==null){
                plan.all_breadth_electives.push(course.course_name+'*');
            }else{
                plan.all_breadth_electives.push(course.course_name);
            }
        });
        console.log("res send");
        console.log(data.plan);
        console.log(data);
        response.setHeader("Content-Type", "application/json");
        response.send(JSON.stringify(data));
    }, 3000)
}