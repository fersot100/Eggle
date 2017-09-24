function parse(program){
	var result = parseExpression(program);
	if(skipSpace(result.rest).length > 0)
		throw new SyntaxError("Unexpected text after program");
	return result.expr;
}

console.log(parse("+(a, 10)"))

function parseExpression(program) {
	program = skipSpace(program);
	var match, expr;
	//Matches any value in quotes
	if(match = /^"(["]*)/.exec(program))
		expr = {type: "value", value: match[1]};
	//Matches any sequence of digits
	else if(match = /^\d+\b/.exec(program))
		expr = {type: "value", value: Number(match[0])};
	//Matches words not in quotes
	else if(match = /^[^\s(),"]+/.exec(program))
		expr = {type: "word", name: match[0]};
	//If no words match, there is a syntax error in the code
	else
		throw new SyntaxError("Unexpected Syntax: " + program);

	return parseApply(expr, program.slice(match[0].length));
}

function skipSpace(string) {
	//Finds the next instance of a non-whitespace character
	var first = string.search(/\S/);
	//If none exists return an empty string
	if(first == -1) return "";
	//Return the string withe the empty space sliced off
	return string.slice(first);
}

function parseApply(expr, program){
	//Move to the next non-whitespace
	program = skipSpace(program);

	if(program[0] != "(")
		return {expr: expr, rest: program};

	program = skipSpace(program.slice(1));
	expr = {type: "apply", operator: expr, args: []};
	while(program[0] != ')'){
		var arg = parseExpression(program);
		expr.args.push(arg.expr);
		program = skipSpace(arg.rest);
		if(program[0] == ',')
			program = skipSpace(program.slice(1));
		else if(program[0] != ')')
			throw new SyntaxError("Expected ',' or ')'");
	}
	return parseApply(expr, program.slice(1));
}


