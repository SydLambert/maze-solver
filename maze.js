class Grid{
	constructor(width=3, height=3){
		this.width=width;
		this.height=height;

		this.cells=[];
		for(let x=0;x<this.width;x++){
			this.cells.push([]);
			for(let y=0;y<this.height;y++){
				this.cells[x].push(new Cell(this,x,y));
			}
		}
		this.cells[0][0].color="#FF0000";
		this.cells[this.width-1][this.height-1].color="#00FF00";
	}

	render(ctx,{
		color="#000000",
		backgroundColor="#FFFFFF",
		curvy=false
	}={}){
		ctx.fillStyle=backgroundColor;
		ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

		let cellWidth=ctx.canvas.width/this.width;
		let cellHeight=ctx.canvas.height/this.height;

		this.cells.flat().forEach(cell=>{
			cell.links.forEach(link=>{
				ctx.strokeStyle=cell.mapped ? "gold" : color;
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

		this.cells.flat().filter(e=>
			((!curvy&&e.visited)||e.color) || (curvy&&e.color)
		).forEach(cell=>{
			ctx.fillStyle=cell.color || (cell.mapped ? "gold" : color);
			ctx.fillRect(
				Math.ceil(cell.x*cellWidth+(cellWidth/4)),
				Math.ceil(cell.y*cellHeight+(cellHeight/4)),
				Math.ceil(cellWidth/2),
				Math.ceil(cellHeight/2)
			);
		});

		ctx.strokeStyle="magenta";
		ctx.lineWidth=cellWidth*0.25;
		ctx.beginPath();
		ctx.moveTo(
			Math.ceil(((this.width-1)*cellWidth)+cellWidth/2),
			Math.ceil(((this.height-1)*cellHeight)+cellHeight/2)
		);
		let lineParent=child=>{
			if(child.parent!=null){
				ctx.lineTo(
					Math.ceil((child.parent.x*cellWidth)+cellWidth/2),
					Math.ceil((child.parent.y*cellHeight)+cellHeight/2)
				);
				lineParent(child.parent);
			}
		}
		lineParent(this.cells[this.width-1][this.height-1]);
		ctx.stroke();
	}

	async generateMaze(ctx,delay=1){
		let stack=[this.cells[0][0]];
		while(stack.length){
			let top=stack[stack.length-1];
			top.visited=true;
			let adjacent=top.getAdjacent().filter(e=>!e.visited);
			if(adjacent.length){
				let link=adjacent[Math.floor(Math.random()*adjacent.length)];
				top.links.push(link);
				stack.push(link);
				if(ctx && delay>0){
					this.render(ctx);
					await new Promise(resolve=>setTimeout(()=>resolve(),delay));
				}
			}
			else{
				stack.pop();
			}
		}
	}

	async solveMaze(ctx,delay=1){
		let nodes=[this.cells[0][0]];
		let end=this.cells[this.width-1][this.height-1];
		nodes[0].globalGoal=this.width+this.height-2;
		nodes[0].localGoal=0;
		end.mapped=true;
		while(nodes.length){
			if(ctx && delay>0){
				this.render(ctx);
				await new Promise(resolve=>setTimeout(()=>resolve(),delay));
			}
			let current=nodes[0];
			if(!current.mapped){
				current.links.forEach(child=>{
					nodes.push(child);
					if(current.localGoal+1 < child.localGoal){
						child.parent=current;
						child.localGoal=current.localGoal+1;
					}
					child.globalGoal=child.localGoal+child.distanceTo(end); //heuristic is distanceto
				});
				current.mapped=true;
			}
			nodes.splice(0,1);
			nodes.sort((a,b)=>a.globalGoal-b.globalGoal);
		}
	}
}

class Cell{
	constructor(grid, x, y){
		this.grid=grid;
		this.x=x;
		this.y=y;
		this.color=null;

		this.links=[];
		this.visited=false;

		this.globalGoal=Infinity;
		this.localGoal=Infinity;
		this.parent=null;
		this.mapped=false;
	}

	getAdjacent(){
		return [
			this.x>0 					? this.grid.cells[this.x-1][this.y] : null,
			this.y>0 					? this.grid.cells[this.x][this.y-1] : null,
			this.x+1<this.grid.width	? this.grid.cells[this.x+1][this.y] : null,
			this.y+1<this.grid.height 	? this.grid.cells[this.x][this.y+1] : null,
		].filter(e=>e);
	}

	distanceTo(x, y){
		if(x instanceof Cell){
			return this.distanceTo(x.x,x.y);
		}
		else{
			return Math.abs(this.x-x)+Math.abs(this.y-y);
		}
	}
}

const elems=[
	"canvas"
].reduce((a,e)=>Object.assign(a,{[e]:document.querySelector(e)}),{});

const ctx=elems.canvas.getContext("2d");

let grid;
grid=new Grid(160,120);
//grid=new Grid(64,48);
//grid=new Grid(32,24);
//grid=new Grid(16,12);
//grid=new Grid(8,6);
//grid=new Grid(4,3);
grid.generateMaze();
grid.render(ctx);
