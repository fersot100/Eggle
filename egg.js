function parse(program){
	var result = parseExpression(program);
	if (skipSpace(result.rest).length > 0)
		throw new SyntaxError("Unexpected text after program");
	return result.expr;
}
//Parses expressions
function parseExpression(program) {
	program = skipSpace(program);
	var match, expr;
	//Matches any value in quotes and returns the first parenthetical value
	if (match = /^"(["]*)/.exec(program))
		expr = {type: "value", value: match[1]};
	//Matches any sequence of digits adn returns full string
	else if (match = /^\d+\b/.exec(program))
		expr = {type: "value", value: Number(match[0])};
	//Matches words not in quotes and returns full string
	else if (match = /^[^\s(),"]+/.exec(program))
		expr = {type: "word", name: match[0]};
	//If no words match, there is a syntax error in the code
	else
		throw new SyntaxError("Unexpected Syntax: " + program);
	return parseApplication(expr, program.slice(match[0].length));
}
// Takes a string and clips all the ws leading up to the first non-ws
function skipSpace(string) {
	//Finds the next instance of a non-whitespace character
	var first = string.search(/\S/);
	//If none exists return an empty string
	if (first == -1) return "";
	//Return the string withe the empty space sliced off
	return string.slice(first);
}
//Parses applications
function parseApplication(expr, program){
	//Move to the next non-whitespace
	program = skipSpace(program);

	// If the first character of the program is 
	// a open parenthesis, it's a variable, not an application
	if (program[0] != "(")
		return {expr: expr, rest: program}

	//If it isn't the beginning of an expression, it's an application

	//Move one character forward and skip whitespace (skip '(')
	program = skipSpace(program.slice(1));
	expr = {type: "apply", operator: expr, args: []};
	while (program[0] != ')'){
		//Parse the thing at the current point in the expression
		var arg = parseExpression(program);
		//Add arguments to the object to return
		expr.args.push(arg.expr);
		//Move forward in whitespace
		program = skipSpace(arg.rest);
		//The program should equal a comma and be skipped
		if (program[0] == ',')
			program = skipSpace(program.slice(1));
		//If there is no comma and not at the end, there's something weird
		else if (program[0] != ')')
			throw new SyntaxError("Expected ',' or ')'");
	}
	//Once the entire application is finished, we move past the 
	//Outer parenthesis and pass in our expression
	return parseApplication(expr, program.slice(1));
}

function evaluate(expr, env) {
	//Depending on the type of expression, the evaluator performs
	//different tasks.
	switch(expr.type) {
		//An immediate number or string value gets returned naturally 
		case "value":
			return expr.value;
		//A non-function variable is checked against the env variables
		case "word":
			//If the variable is found, we return the value previously assigned
			if(expr.name in env)
				return env[expr.name]
			else
			//Otherwise the variable is undefined and we return an error
				throw new ReferenceError('Undefined variable: ' + expr.name);
		//In the case of the expression being a function
		case "apply":
			//If the function is a variable type and defined.
			if (expr.operator.type == "word" && expr.operator.name in specialForms){
				//We return the correspondeing function for the name provided, 
				//with the corresponding arguments
				return specialForms[expr.operator.name](expr.args, env);
			}
			var op = evaluate(expr.operator, env);
			if (typeof op != "function")
				throw new TypeError("Applying a non-function");
			return op.apply(null, expr.args.map(function(arg){
				return evaluate(arg, env);
			}));
	}
}

var specialForms = {
	if: function (args, env) {
		if (args.length != 3){
			throw new SyntaxError('Bad number of args to if');
		}
		//Only evaluates to true when the function returns the BOOLEAN true
		if (evaluate(args[0], env) !== false)
			return evaluate(args[1], env);
		else
			return evaluate(args[2], env);
	},
	while: function (args, env) {
		if (args.length != 2)
			throw new SyntaxError("Bad number of args to while");

		while (evaluate(args[0], env) !== false)
			evaluate(args[1], env);
		//Since undefied does not exist in the language, we return false
		return false;
	},
	do: function (args, env){
		var value = false;
		args.forEach(function (arg) {
			value = evaluate(arg, env);
		});
		return value;
	},
	define: function (args, env){
		if (args.length != 2 || args[0].type != 'word')
			return new SyntaxError('Bad use of define');
		var value = evaluate(args[1], env);
		env[args[0].name] = value;
		return value;
	}
}

function TopEnv(){
	this.true = true;
	this.false = false;
	['+', '-', '*', '/', '==', '<', '>'].forEach(function(op) {
		this[op] = new Function("a, b", "return a" + op + " b;");
	}.bind(this));
	this.print = function (value) {
		console.log(value);
		return value;
	};
}

function run() {
	var env = new TopEnv();
	//This line converts arguments into an array
	var program = Array.prototype.slice.call(arguments, 0).join("\n");
	return evaluate(parse(program), env);
}

run("do(define(total, 0),",
    "   define(count, 1),",
    "   while(<(count, 11),",
    "         do(define(total, +(total, count)),",
    "            define(count, +(count, 1)))),",
    "   print(total))");