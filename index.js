/*
	This index.js file brings Cell.js and Grid.js together. Those classes will work independently
	from this file, however their functionality will be purely console-based. This file contains the
	necessary code to add graphics and interactivity to the demonstration.
*/

/*
	Various elements in the DOM will need to be accessed throughout the execution of this program,
	be it to manipulate them or retreieve data from them. The following code takes an array of
	selectors and maps it to an object, with keys and values corresponding to the selectors and
	their targets.

	Any non-alphanumerical characters are removed from object keys, as those characters are illegal
	when referencing object properties with the 'object.property' syntax.

	A simple reduction is used to transform
		["tagName", "#id"]
	Into
		{
			tagName : HTMLElement,
			id : HTMLElement
		}
*/
const elem=[
	"canvas", //The main canvas
	"#gridSize", //The select element where the user specifies grid size
	"#generate", //The button that starts the maze generation
	"#algorithm", //The select element where the user specifies the algorithm for the maze solver
	"#solve", //The button that starts the maze solver
	"#stop", //The button the stops both the generator and solver
	"#canvasOverlay" //The introduction text on top of the canvas
].reduce((a,e)=>
	Object.assign(a,{[e.replace(/\W/,"")]:document.querySelector(e)}
),{});

/*
	The 'Grid.solveMaze' method takes two arguments, a rendering context and an options object.
	The following object literal specifies the parameters that will be passed into 'Grid.solveMaze'
	depending on the solving algorithm the user has chosen. I chose these algorithms as they have
	a very similar underlying core, so I can pass in minor modifications to differentiate between
	them, rather than changing the function entirely.

	The function is set up by default to solve the maze using A*. The 'greedy' flag forces the
	solver to continue searching for a better solution, even if it has already found a solution.
	The Heuristic for the A* algorithm is given by the Manhattan distance from the current cell to
	the bottom rightmost cell.When the heuristic is disabled, A* emulates the path of the Dijkstra
	algorithm. The heuristic based algorithms aren't able to shine fully in such a linear task, but
	it is interesting to watch them.
*/
const algorithms={
	"A*":{},
	"A* (greedy)":{greedy:true},
	"Dijkstra":{heuristic:false}
};

/*
	'ctx' holds the rendering context that the maze will be drawn to.
*/
const ctx=elem.canvas.getContext("2d");

/*
	The main render function. Draws a visual representation of the given Grid object to the 2D
	rendering context. The options argument adjusts the aesthetics of the diagram.
*/
const render=(grid, ctx,{
	color="#FFFFFF", //The foreground color of the main maze
	backgroundColor="#000000", //The color of the maze walls
	startColor="#FF7777", //The color of the starting cell (top left)
	endColor="#AAFF66", //The color of the ending cell (bottom right)
	mappedColor="#FFD700", //The color that indicates a cell has been visited by an algorithm
	pathColor="#FF00FF", //The color of the final solution path line
	curvy=false //Boolean flag determining whether or not the maze path should have rounded edges
}={})=>{
	/*
		Draws a background layer covering the whole canvas, this both adds a background color and
		fills over any previous paints to the canvas.
	*/
	ctx.fillStyle=backgroundColor;
	ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

	/*
		The cell width and height are such that all the cells in the Grid object will render to fit
		the whole canvas exactly when tiled.
	*/
	let cellWidth=ctx.canvas.width/grid.width;
	let cellHeight=ctx.canvas.height/grid.height;

	grid.cells.flat().forEach(cell=>{
		cell.links.forEach(link=>{
			ctx.strokeStyle=cell.mapped ? mappedColor : color;
			ctx.lineWidth=cellWidth*0.5;
			ctx.beginPath();
			ctx.moveTo(
				Math.ceil((cell.x*cellWidth)+cellWidth/2),
				Math.ceil((cell.y*cellHeight)+cellHeight/2)
			);
			ctx.lineTo(
				Math.ceil((link.x*cellWidth)+cellWidth/2),
				Math.ceil((link.y*cellHeight)+cellHeight/2)
			);
			ctx.stroke();
		});
	});

	grid.cells.flat().filter(e=>
		((!curvy&&e.visited)||e.color) || (curvy&&e.color)
	).forEach(cell=>{
		ctx.fillStyle=cell.color || (cell.mapped ? mappedColor : color);
		if(!cell.distanceTo(0,0)) ctx.fillStyle=startColor;
		if(!cell.distanceTo(grid.width-1, grid.height-1)) ctx.fillStyle=endColor;
		ctx.fillRect(
			Math.ceil(cell.x*cellWidth+(cellWidth/4)),
			Math.ceil(cell.y*cellHeight+(cellHeight/4)),
			Math.ceil(cellWidth/2),
			Math.ceil(cellHeight/2)
		);
	});

	ctx.strokeStyle=pathColor;
	ctx.lineWidth=cellWidth*0.25;
	ctx.beginPath();
	ctx.moveTo(
		Math.ceil(((grid.width-1)*cellWidth)+cellWidth/2),
		Math.ceil(((grid.height-1)*cellHeight)+cellHeight/2)
	);

	grid.cells[grid.width-1][grid.height-1].lineParents(ctx, cellWidth, cellHeight);
	ctx.stroke();
};

/*
	'grid' will hold the instance of the Grid class that the user will be interacting with.
	'stop' holds a boolean flag to end the execution of the asynchronous functions for maze
	generation and solving.
*/
let grid;
let stop=false;

/*
	The following function enables or disables the on-screen buttons. This is to prevent the user
	from executing multiple requests simultaneously on a single Grid object. The stop button will
	facilitate the need to end the current task and begin a new one.
*/
const enableInputs=enabled=>[
	elem.gridSize,
	elem.generate,
	elem.algorithm,
	elem.solve,
].forEach(e=>e.disabled=!enabled);

/*
	This code sets the function to be executed when the user presses the 'generate' button. It gets
	the grid size from the user input box and constructs a new Grid object with those dimensions.
	The 'generateMaze' method is then called on the newly created Grid object which creates a
	random maze in that object.

	Note how the user's controls are disabled before generating the maze, and only enabled once the
	generation has completed. The user is unable to generate multiple mazes simultaneously. Also
	note how the function is asynchronous; this is so that the 'await' keyword can be used to
	suspend the function's execution while the maze generation completes.
*/
elem.generate.addEventListener("click",async e=>{
	elem.canvasOverlay.style.display="none";
	let gridSize=elem.gridSize.value.split("*");
	grid=new Grid(gridSize[0], gridSize[1]);
	enableInputs(false);
	/*
		The conditional operator in the following line determines whether or not to pass a rendering
		context into the 'generateMaze' function. Passing a rendering context to that function will
		animate the generation of the maze. Even with a minimal frame delay this animation can take
		a considerable length of time with larger grids, so I opted to remove the animation entirely
		from large grid sizes.
	*/
	await grid.generateMaze(gridSize[0]<=32 ? ctx : null);
	/*
		One final render to clear up any artefacts left by the maze generator. If animations were
		disabled in the maze generator, this will be the first canvas update that the user will see.
	*/
	render(grid, ctx);
	enableInputs(true);
});

/*
	This code sets the function to be executed when the user presses the 'solve' button. It first
	checks that the user has generated a maze, and issues a warning if they haven't. Then, like the
	'generate' button, the user's controls are disabled & re-enabled once the task has completed.
	Before the solving algorithm starts, all the solving metadata in the cells is set to default
	so that any previous attempts at a solution don't interfere with the current attempt. The
	'.flat()' method is used as a quick way to iterate through all elements in a multidimensional
	array. The solving algorithm specified by the user is passed into the maze solver in the form
	of an object literal detailing alterations to be made to the core algorithm.
*/
elem.solve.addEventListener("click",async e=>{
	if(grid){
		enableInputs(false);
		grid.cells.flat().forEach(cell=>{
			cell.globalGoal=Infinity;
			cell.localGoal=Infinity;
			cell.parent=null;
			cell.mapped=false;
		});
		/*
			Again, like the maze generator, a rendering context is only supplied when the grid is
			below a certain size.
		*/
		await grid.solveMaze(grid.width<=32 ? ctx : null,algorithms[elem.algorithm.value]);
		render(grid, ctx);
		enableInputs(true);
	}
	else{
		if(!elem.canvasOverlay.innerHTML.includes("?")){
			elem.canvasOverlay.innerHTML+="<br />?Please generate a maze first<br />Ready."
		}
	}
});

/*
	This code sets the function to be executed when the user presses the 'stop' button. It simply
	sets the stop flag to true. Assuming all tasks have ended, the user's controls are enabled.
*/
elem.stop.addEventListener("click",e=>{
	stop=true;
	enableInputs(true);
});
