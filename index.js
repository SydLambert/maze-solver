const elem=[
	"canvas",
	"#gridSize",
	"#generate",
	"#algorithm",
	"#solve",
	"#stop",
].reduce((a,e)=>
	Object.assign(a,{[e.replace(/\W/,"")]:document.querySelector(e)}
),{});

const algorithms={
	"A*":{},
	"A*Greedy":{greedy:true},
	"Dijkstra":{heuristic:false}
};

const ctx=elem.canvas.getContext("2d");

let grid;
let stop=false;

const enableInputs=enabled=>[
	elem.gridSize,
	elem.generate,
	elem.algorithm,
	elem.solve,
].forEach(e=>e.disabled=!enabled);

elem.generate.addEventListener("click",async e=>{
	let gridSize=elem.gridSize.value.split("*");
	grid=new Grid(gridSize[0], gridSize[1]);
	enableInputs(false);
	await grid.generateMaze(gridSize[0]<=32 ? ctx : null);
	grid.render(ctx);
	enableInputs(true);
});

elem.solve.addEventListener("click",async e=>{
	if(grid){
		enableInputs(false);
		grid.cells.flat().forEach(cell=>{
			cell.globalGoal=Infinity;
			cell.localGoal=Infinity;
			cell.parent=null;
			cell.mapped=false;
		});
		await grid.solveMaze(grid.width<=32 ? ctx : null,algorithms[elem.algorithm.value]);
		grid.render(ctx);
		enableInputs(true);
	}
	else{
		alert("Please generate a maze first.");
	}
});

elem.stop.addEventListener("click",e=>{
	stop=true;
	enableInputs(true);
});
