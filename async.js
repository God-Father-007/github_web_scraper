require("chromedriver"); // import cgromedriver

let wd = require("selenium-webdriver"); // import selenium webdriver
let browser = new wd.Builder().forBrowser('chrome').build(); // build a new browser

const fs = require('fs'); // for file reading/writing

// collection of all topic
let topicsCollection = []

async function main() {
    await browser.get("https://github.com/topics"); // go to starting page

    // wait and fetxh tags for topics
    await browser.wait(wd.until.elementsLocated(wd.By.css(".no-underline.d-flex.flex-column.flex-justify-center")));
    let topicsRef = await browser.findElements(wd.By.css(".no-underline.d-flex.flex-column.flex-justify-center"));
    
    // ectract URLs in topics[]
    let topics = [];
    for(let ref of topicsRef) { topics.push( await ref.getAttribute("href") ); }

    // traverse through topics[]
    for( let topic of topics ) {
        fetchTopicInfo(topic);
    }
    
    browser.close();
}

// runs for one topic
async function fetchTopicInfo(topic) {
    let browser = new wd.Builder().forBrowser('chrome').build(); // build a new browser
    // load topic page
    await browser.get(topic);
    // wait and fetch project list
    await browser.wait(wd.until.elementsLocated(wd.By.css(".f3.color-text-secondary.text-normal.lh-condensed a.text-bold")));
    let projectsRef = await browser.findElements(wd.By.css(".f3.color-text-secondary.text-normal.lh-condensed a.text-bold"));
    // shorten it to first eight
    projectsRef.splice(8);
    // getting topic name
    let topicName = await browser.findElement(wd.By.css(".h1-mktg"));
    topicName = await topicName.getAttribute("innerText");
    console.log(topicName, " : ");
    // extract URLs in projects[]
    let projects = [];
    for( let ref of projectsRef ) { projects.push( await ref.getAttribute("href") ); }
    // stores info of current topic
    let currentTopic = {};
    // collection of all projects of that particular topic
    let projectsCollection = [];
    // traverse through projects[]
    for( let project of projects ) {
        fetchProjectInfo(project, projectsCollection);
    }
    // fill info in object
    currentTopic["Topic Name"] = topicName;
    currentTopic["Projects"] = projectsCollection;
    // add to collection
    topicsCollection.push(currentTopic);
    browser.close();
}

async function fetchProjectInfo(project, projectsCollection) {
    let browser = new wd.Builder().forBrowser('chrome').build(); // build a new browser
    // load project page
    await browser.get(project);
    // wait and fetch refernce for issues page
    await browser.wait(wd.until.elementsLocated(wd.By.css(".UnderlineNav-body.list-style-none li a")));
    let issuesRef = await browser.findElements(wd.By.css(".UnderlineNav-body.list-style-none li a"));
    // getting project name
    let projectName = await browser.findElement(wd.By.css(".mr-2.flex-self-stretch a"));
    projectName = await projectName.getAttribute("innerText");
    console.log( "\t" , projectName, " : ");
    // get URL of issues page
    issuesRef = await issuesRef[1].getAttribute("href");
    // stores info of current project
    let currentProject = {};
    // collection of all issues of that particular project
    let issuesCollection = [];
    // if no issues tab found, then do following
    if( !issuesRef.includes("issues") ) {
        // fill info in object
        currentProject["Project Name"] = projectName;
        issuesCollection = ["Issues Tab Not Found!"];
        currentProject["Issues"] = issuesCollection;
        // add to collection
        projectsCollection.push(currentProject);
        browser.close();
        return;
    }
    // if issues tab foung, load page
    await browser.get(issuesRef);
    // implies if there is a next page or not, used to run while loop
    let hasNext = true;
    while( hasNext ) {
        // wait and fetch all issues on current page
        // await browser.wait(wd.until.elementsLocated(wd.By.css(".Box-row--focus-gray"))); // issues
        let issues = await browser.findElements(wd.By.css(".Box-row--focus-gray a.Link--primary"));
        // issues list is empty
        if( issues.length == 0 ) {
            // push a messege for empty list
            issuesCollection.push("There aren’t any open issues.");
            break;
        }
        // traversing through issues list of current page
        for( let issue of issues ) {
            // stores heading and URL of one issue
            let issueData = {};
            // getting data
            issueData["Heading"] = await issue.getAttribute("innerText");
            issueData["URL"] = await issue.getAttribute("href");
            // addd to collection
            issuesCollection.push(issueData);
        }
        // checking if next page button is there or not
        let nextPage = await browser.findElements(wd.By.css(".next_page"));
        // if not, break out to another project
        if( nextPage.length == 0 ) { break; }
        // if found, checking if it's disbled or not
        nextPage = await browser.findElements(wd.By.css(".next_page.disabled"));
        // if disabled, returns non empty array
        if( nextPage.length != 0 ) { hasNext = false; }
        else {
            // if not disabled, fetch next page URL and load page in browser
            nextPage = await browser.findElement(wd.By.css(".d-sm-none div a.next_page"));
            await browser.get(await nextPage.getAttribute("href"));
        }
    }
    // fill info in object
    currentProject["Project Name"] = projectName;
    currentProject["Issues"] = issuesCollection;
    // add to collection
    projectsCollection.push(currentProject);
    browser.close();
    
    fs.writeFileSync("output.json",JSON.stringify(topicsCollection));
}

main();