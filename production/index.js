const elem=[
	"canvas",
	"#gridSize",
	"#generate",
	"#algorithm",
	"#solve",
	"#stop",
	"#canvasOverlay"
].reduce((a,e)=>
	Object.assign(a,{[e.replace(/\W/,"")]:document.querySelector(e)}
),{});

const algorithms={
	"A*":{},
	"A* (greedy)":{greedy:true},
	"Dijkstra":{heuristic:false}
};

const ctx=elem.canvas.getContext("2d");

const render=(grid, ctx,{
	color="#FFFFFF",
	backgroundColor="#000000",
	startColor="#FF7777",
	endColor="#AAFF66",
	mappedColor="#FFD700",
	pathColor="#FF00FF",
	curvy=false
}={})=>{
	ctx.fillStyle=backgroundColor;
	ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

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
		(!curvy && e.visited) ||
		e.color ||
		(!e.distanceTo(0,0) ||
		!e.distanceTo(grid.width-1, grid.height-1))
	).forEach(cell=>{
		ctx.fillStyle=cell.color||(cell.mapped?mappedColor:color);
		if(!cell.distanceTo(0,0)) ctx.fillStyle=startColor;
		if(!cell.distanceTo(grid.width-1,grid.height-1)) ctx.fillStyle=endColor;
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
		Math.ceil(((grid.width-1)*cellWidth)+cellWidth/2), //x
		Math.ceil(((grid.height-1)*cellHeight)+cellHeight/2) //y
	);

	grid.cells[grid.width-1][grid.height-1].lineParents(ctx, cellWidth, cellHeight);
	ctx.stroke();
};

let grid;
let stop=false;

const enableInputs=enabled=>[
	elem.gridSize,
	elem.generate,
	elem.algorithm,
	elem.solve,
].forEach(e=>e.disabled=!enabled);

elem.generate.addEventListener("click",async e=>{
	elem.canvasOverlay.style.display="none";
	let gridSize=elem.gridSize.value.split("*");
	grid=new Grid(gridSize[0], gridSize[1]);
	enableInputs(false);
	await grid.generateMaze(gridSize[0]<=32 ? ctx : null);
	render(grid, ctx);
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
		render(grid, ctx);
		enableInputs(true);
	}
	else{
		if(!elem.canvasOverlay.innerHTML.includes("?")){
			elem.canvasOverlay.innerHTML+="<br />?Please generate a maze first<br />Ready."
		}
	}
});

elem.stop.addEventListener("click",e=>{
	stop=true;
	enableInputs(true);
});
