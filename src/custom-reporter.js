const fs = require('fs');
const ejs = require('ejs');
const path = require('path')

const getOptions = require('./utils/getOptions');
const getOutputPath = require('./utils/getOutputPath');

function transformResult(results) {

    let retResultsMap = new Map();
    let perfStats = undefined;
    results.testResults.forEach(function (outerTestResult) {
        let testFilePath = outerTestResult.testFilePath;
        let failureMessage = outerTestResult.failureMessage;
        perfStats = outerTestResult.perfStats;

        let innerTestResults = outerTestResult.testResults;
        for (const innerTestResult of innerTestResults) {
            let supperTitle = innerTestResult.ancestorTitles[0];
            // innerTestResult.ancestorTitles=[];

            let retArray = retResultsMap.get(supperTitle);
            if (retArray === undefined) {
                retArray = [];
                retResultsMap.set(supperTitle, retArray);
            }
            retArray.push(innerTestResult);
            let failureDetails = innerTestResult.failureDetails;
            let failureMessages = innerTestResult.failureMessages;
            let failureMessagesFinal = [];

            for (let i = 0; i < failureMessages.length; i++) {
                failureMessagesFinal = failureMessagesFinal.concat(failureMessages[i].split("\n"))
                // failureMessages[i] = failureMessages[i].split("\n")[0].replace("Error:","");
            }
            innerTestResult.failureMessages = failureMessagesFinal;
        }
    });


    let retResults = [];
    let numFailedTests = 0;
    let numFailedTestSuites = 0;
    let numPassedTests = 0;
    let numPassedTestSuites = 0;

    let numTotalTests = 0;
    let numTotalTestSuites = 0;
    let success = false;
    let startTime = results.startTime;


    retResultsMap.forEach(function (value, key, map) {
        let retResult = {};
        let numFailingTests = 0;
        let numPassingTests = 0;
        let numPendingTests = 0;
        let numTodoTests = 0;
        let failureMessage = "";
        let testResults = value;
        let testFilePath = key;
        let passedFlag = true;

        let dur = 0;
        for (let innerTestResult of value) {
            dur += innerTestResult.duration;
            let status = innerTestResult.status;
            if ("failed" === status) {
                numFailingTests += 1;
                let failureMessages = innerTestResult.failureMessages;
                failureMessage += failureMessages.join("\n")
                passedFlag = false;
            } else if ("passed" === status) {
                numPassingTests += 1;
            }
        }
        retResult.numFailingTests = numFailingTests;
        retResult.numPassingTests = numPassingTests;
        retResult.numPendingTests = numPendingTests;
        retResult.numTodoTests = numTodoTests;
        retResult.failureMessage = failureMessage;
        retResult.testResults = testResults;
        retResult.testFilePath = testFilePath;

        let perfStatsTmp = {...perfStats};
        perfStatsTmp.start = perfStats.start;
        perfStatsTmp.end = perfStats.start + dur;
        perfStats.start = perfStatsTmp.end;

        retResult.perfStats = perfStatsTmp;
        retResults.push(retResult);
        numFailedTests += numFailingTests;
        numPassedTests += numPassingTests;
        if (passedFlag) {
            numPassedTestSuites += 1;
        } else {
            numFailedTestSuites += 1;
        }
    });


    numTotalTestSuites = numFailedTestSuites + numPassedTestSuites;
    numTotalTests = numFailedTests + numPassedTests;
    if (numFailedTests === 0) {
        success = true;
    } else {
        success = false;
    }
    let finalResult = {};
    finalResult.success = success;
    finalResult.startTime = startTime;
    finalResult.numPendingTests = 0;
    finalResult.numPendingTestSuites = 0;
    finalResult.numRuntimeErrorTestSuites = 0;
    finalResult.numTotalTests = numTotalTests;
    finalResult.numTotalTestSuites = numTotalTestSuites;
    finalResult.numFailedTests = numFailedTests;
    finalResult.numFailedTestSuites = numFailedTestSuites;
    finalResult.numPassedTests = numPassedTests;
    finalResult.numPassedTestSuites = numPassedTestSuites;
    finalResult.testResults = retResults;

    return finalResult;
}


class CustomReporter {
    constructor(globalConfig, reporterOptions, reporterContext) {
        this._globalConfig = globalConfig;
        this._options = reporterOptions;
        this._context = reporterContext;
    }

    onRunComplete(testContexts, results) {
        console.log('Custom reporter output:');
        console.log('----------------------------retResult-pre--------------------: ', JSON.stringify(results, null, 2));
        results = transformResult(results);
        console.log('----------------------------retResult---------------------: ', JSON.stringify(results, null, 2));
        console.log('options for this reporter from Jest config: ', this._options);
        console.log('reporter context passed from test scheduler: ', this._context);

        const data = this.transformData(results)
        console.log('----------------------------data---------------------: ', JSON.stringify(data, null, 2));
        // If jest-junit is used as a reporter allow for reporter options
        // to be used. Env and package.json will override.
        const options = getOptions.options(this._options);
        let jestRootDir = this._globalConfig?.rootDir
        let outputPath = getOutputPath(options, jestRootDir);
        console.log('outputPath: ', outputPath);

        // 数据
        // const data = {
        //     title: 'Dynamic HTML',
        //     name: 'John',
        //     numTotalTestFiles: 3,
        //     numFailedTestFiles: 1,
        //     numPassedTestFiles: 2,
        //     numTotalTests: 3,
        //     numFailedTests: 1,
        //     numPassedTests: 2,
        //     testResults: [
        //         {
        //             "fileName": "监控平台1.side",
        //             "testName": "角色操作",
        //             "state": "passed"
        //         },
        //         {
        //             "fileName": "监控平台2.side",
        //             "testName": "用户操作",
        //             "state": "passed"
        //         },
        //         {
        //             "fileName": "监控平台3.side",
        //             "testName": "系统操作",
        //             "state": "failed"
        //         }
        //     ]
        // };

        // 读取 EJS 模板文件
        // 获取当前正在执行的 JavaScript 文件的目录路径
        const currentDirectory = __dirname;
        // 想要读取的文件的路径
        const templateFilePath = path.join(currentDirectory, 'template.ejs');

        fs.readFile(templateFilePath, 'utf8', (err, template) => {
            if (err) {
                console.error('Error reading template:', err);
                return;
            }
            // 使用 EJS 渲染模板
            const htmlContent = ejs.render(template, data);
            // 写入生成的 HTML 到文件
            fs.writeFile(outputPath, htmlContent, (err) => {
                if (err) {
                    console.error('Error writing HTML file:', err);
                    return;
                }
                console.log('HTML file generated: output.html');
            });
        });
    }

    transformData(results) {
        let ret = {};
        ret['numFailedTests'] = results['numFailedTests']
        ret['numTotalTests'] = results['numTotalTests']
        ret['numPassedTests'] = results['numPassedTests']
        ret['numPassedTestFiles'] = results['numPassedTestSuites']
        ret['numFailedTestFiles'] = results['numFailedTestSuites']
        ret['numTotalTestFiles'] = results['numTotalTestSuites']

        let testResults = [];
        for (let fileTests of results["testResults"]) {
            let fileName = fileTests['testFilePath'];
            for (let test of fileTests['testResults']) {
                let testName = test['title']
                let status = test['status']
                let testResult = {};
                testResult["fileName"]= fileName;
                testResult["testName"]= testName;
                testResult["state"]= status;
                testResults.push(testResult);
            }
        }
        ret["testResults"]=testResults;
        return ret;
    }
}

module.exports = CustomReporter;