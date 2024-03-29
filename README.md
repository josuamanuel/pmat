# **pmat - Postman Automation Testing -**

Introduction
===

**pmat is a javascript library that integrates in a postman collection to automatize regression testing.**

Regression Testing is a type of software testing to confirm that a software change has not adversely affected existing features.

pmat validates a new version of the software by comparing the output it generates against a previously saved output generated by a certified version of the software. Input data is kept the same in both runs.

Run1: Software certified 

    Software(Input) = Output

Run2: Software to test

    Software'(Input) = Output'

<pre>
<code> Output &asymp; Output' </code>
</pre>

Note we used approximately ≈ and not = as it is impossible to capture all the environment data impacting execution. **Test scsripts** define the conditions under which Output is equal to Output'

    testConditions(Output) = Output'

For example: We can define in testConditions that certain nodes from Output not to be considered when comparing with Output'. [Test Conditions](#test-conditions)


pmat is based in the principle that output generated by the software is highly correlated with the binomio Softaware and Input Data. Given same input to two different versions of the software, we could say they are equivalent if the output generated for each version coincides in most of circustances.


pmat covers the following functionlities:

 * Can be used in postman, runner, newman.
 * Record mode:
   * Automatic generation of test scripts to validate status and response body.
   * Automatic saving of responses from postman executions or iteration runs in runner or newman. The record responses are used 
 * Test mode:
   * Execute test scripts comparing record test data agains current execution.
 * Test cases can be modified manually:
   * Excluding nodes for comparison can be done using easy expressions: country.town.**.date*
   * Description of test cases Nodes can changed
   * Skipping requests to test.
   * Defining these values at general request level or specifically for each particular test case.
* Input data:
   * definition and values of Input data required for each iteration
   * API to save input data for other executions.

Installation
===

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/46c9b91fd7e2517795f3)

* Click to install set up collection in Postman.
* Execute setup request in Postman

By executing the set up request we pull from github the pmat code and save it as a global postman variable called pmat.

To use pmat we will need to invoke pmat in
* pre-request script: to 
* and test scripts: To record or to test.

Example
===

This step by step guide will demonstrate main functionalities of pmat.

1. Install example collection
2. Execute in record mode
3. Execute in test mode

### Example collection installation

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/75a7a3f77f8ac76c4d75#?env%5BAccount-info%205%20fixed%20users%5D=W3siZGVzY3JpcHRpb24iOnsiY29udGVudCI6IiIsInR5cGUiOiJ0ZXh0L3BsYWluIn0sInZhbHVlIjoiIiwia2V5Ijoibm90aGluZyIsImVuYWJsZWQiOnRydWV9LHsidmFsdWUiOiJ7XCJpbnB1dFwiOntcInVzZXJfaWRcIjpcImRyb2ZsN2M2XCJ9fSIsImtleSI6InRlc3RDYXNlXzAiLCJlbmFibGVkIjp0cnVlfSx7InZhbHVlIjoie1wiaW5wdXRcIjp7XCJ1c2VyX2lkXCI6XCI5Z2xqYXBvNlwifX0iLCJrZXkiOiJ0ZXN0Q2FzZV8xIiwiZW5hYmxlZCI6dHJ1ZX0seyJ2YWx1ZSI6IntcImlucHV0XCI6e1widXNlcl9pZFwiOlwiYWRvcHY5c21cIn1cbiIsImtleSI6InRlc3RDYXNlXzIiLCJlbmFibGVkIjp0cnVlfSx7InZhbHVlIjoie1wiaW5wdXRcIjp7XCJ1c2VyX2lkXCI6XCIyYXB1eHE3bVwifSIsImtleSI6InRlc3RDYXNlXzMiLCJlbmFibGVkIjp0cnVlfSx7InZhbHVlIjoie1wiaW5wdXRcIjp7XCJ1c2VyX2lkXCI6XCI4ZndleW9vaVwifX1cbiIsImtleSI6InRlc3RDYXNlXzQiLCJlbmFibGVkIjp0cnVlfSx7InZhbHVlIjoie1wiVXNlciBMb2dvbiBBdXRoZW50aWNhdGUgYW5kIGdldCBUb2tlbiBmcm9tIEFwcFwiOnt9LFwiR2V0IEFjY291bnRzXCI6e1wiZXhwZWN0ZWRSZXNwb25zZVwiOntcIjIwMFwiOntcImV4Y2x1ZGVSZXNwb25zZUJvZHlOb2Rlc1wiOltcIlwiXSxcInRlc3REZXNjT0tcIjpcIkFkZCBzb21ldGhpbmcuLi4hISFcIn19fSxcIkdldCBCYWxhbmNlc1wiOntcImV4cGVjdGVkUmVzcG9uc2VcIjp7XCIyMDBcIjp7XCJleGNsdWRlUmVzcG9uc2VCb2R5Tm9kZXNcIjpbXCIqKi5EYXRlVGltZVwiXSxcInRlc3REZXNjT0tcIjpcIkFkZCBzb21ldGhpbmcuLi4hISFcIn19fSxcIkdldCBUcmFuc2FjdGlvbnMgZmlsdGVyaW5nXCI6e1wiZXhwZWN0ZWRSZXNwb25zZVwiOntcIjIwMFwiOntcImV4Y2x1ZGVSZXNwb25zZUJvZHlOb2Rlc1wiOltcIlwiXSxcInRlc3REZXNjT0tcIjpcIkFkZCBzb21ldGhpbmcuLi4hISFcIn19fX0iLCJrZXkiOiJ0ZXN0Q29uZGl0aW9ucyIsImVuYWJsZWQiOnRydWV9XQ==)

* Click to install set up example collection.


The example collection is a normal collection that can be run using runner. The only changes made to the collection to add pmat functionality consists on adding the below line to pre-request and test scripts:

~~~javascript
eval(pm.globals.get('pmat'));
~~~

This can be done for each script but it is usually easier to add them to the main folder collection. These scripts will be executed before and after every request under the folder. This saves us from modifying all the requests.

<img src="https://raw.githubusercontent.com/josuamanuel/pmat/master/resources/pmat%20pre-request%20eval.png" style="margin:20px 80px" height="320" width="420"/>

<img src="https://raw.githubusercontent.com/josuamanuel/pmat/master/resources/pmat%20test%20eval.png" style="margin:20px 80px" height="320" width="420"/>

Before executing the collection for the first time we need to set up the execution of pmat in record mode. pmat execution configuration is done by including parameters in global envioronment. Record mode can be scpecified by including a new variable with name record and value true as you can see below:

<img src="https://raw.githubusercontent.com/josuamanuel/pmat/master/resources/globals%20record%20true.png" style="margin:20px 80px" height="320" width="420"/>


to Test:

* Click to install set up example collection.
* Click runner option in newman.
* Configure the runner execution with the following values:


<img src="https://raw.githubusercontent.com/josuamanuel/pmat/master/resources/Collection%20Runner%20execution%20parameters.png" style="margin:20px 80px" height="420" width="420"/>



# Test Conditions

~~~json
{
  "User Logon Authenticate and get Token from App": {},
  "Get Accounts": {
    "expectedResponse": {
      "200": {
        "excludeResponseBodyNodes": [
          "contract.audit.**.timestamp",
          "contract.*.token"
        ],
        "testDescOK": "Add something...!!!"
      }
    }
  }
},
~~~


# End of document - test artificats markdown elements.

Examine the following code

    # Let me re-iterate ...
    for i in 1 .. 10 { do-something(i) }
   
##An h1 header
---



<img src="https://raw.githubusercontent.com/josuamanuel/pmat/master/resources/Collection%20Runner%20execution%20parameters.png" style="margin:20px 80px" height="420" width="420"/>


this is a test

Paragraphs are separated by a blank line.

2nd paragraph. *Italic*, **bold**, and `monospace`. Itemized lists
look like:

  * this one
  * that one
  * the other one

Note that --- not considering the asterisk --- the actual text
content starts at 4-columns in.

> Block quotes are
> written like so.
>
> They can span multiple paragraphs,
> if you like.

Use 3 dashes for an em-dash. Use 2 dashes for ranges (ex., "it's all
in chapters 12--14"). Three dots ... will be converted to an ellipsis.
Unicode is supported. ☺



An h2 header
------------

Here's a numbered list:

 1. first item
 2. second item
 3. third item

Note again how the actual text starts at 4 columns in (4 characters
from the left side). Here's a code sample:

    # Let me re-iterate ...
    for i in 1 .. 10 { do-something(i) }

As you probably guessed, indented 4 spaces. By the way, instead of
indenting the block, you can use delimited blocks, if you like:

~~~
define foobar() {
    print "Welcome to flavor country!";
}
~~~

(which makes copying & pasting easier). You can optionally mark the
delimited block for Pandoc to syntax highlight it:

~~~javascript
import time
# Quick, count to ten!
for i in range(10):
    # (but not *too* quick)
    time.sleep(0.5)
    print i
~~~


- [x] This is a complete item
- [ ] This is an incomplete item
- [ ] 
### An h3 header ###

Now a nested list:

 1. First, get these ingredients:

      * carrots
      * celery
      * lentils

 2. Boil some water.

 3. Dump everything in the pot and follow
    this algorithm:

        find wooden spoon
        uncover pot
        stir
        cover pot
        balance wooden spoon precariously on pot handle
        wait 10 minutes
        goto first step (or shut off burner when done)

    Do not bump wooden spoon or it will fall.

Notice again how text always lines up on 4-space indents (including
that last line which continues item 3 above).

Here's a link to [a website](http://foo.bar), to a [local
doc](local-doc.html), and to a [section heading in the current
doc](#an-h2-header). Here's a footnote [^1].

[^1]: Footnote text goes here.

Tables can look like this:

size  material      color
----  ------------  ------------
9     leather       brown
10    hemp canvas   natural
11    glass         transparent

Table: Shoes, their sizes, and what they're made of

(The above is the caption for the table.) Pandoc also supports
multi-line tables:

--------  -----------------------
keyword   text
--------  -----------------------
red       Sunsets, apples, and
          other red or reddish
          things.

green     Leaves, grass, frogs
          and other things it's
          not easy being.
--------  -----------------------

A horizontal rule follows.

***

Here's a definition list:

apples
  : Good for making applesauce.
oranges
  : Citrus!
tomatoes
  : There's no "e" in tomatoe.

Again, text is indented 4 spaces. (Put a blank line between each
term/definition pair to spread things out more.)

Here's a "line block":

| Line one
|   Line too
| Line tree

and images can be specified like so:

![example image](https://www.getpostman.com/img/v2/logo-big.svg "An exemplary image")

Inline math equations go in like so: $\omega = d\phi / dt$. Display
math should get its own line and be put in in double-dollarsigns:

$$I = \int \rho R^{2} dV$$

And note that you can backslash-escape any punctuation characters
which you wish to be displayed literally, ex.: \`foo\`, \*bar\*, etc.
