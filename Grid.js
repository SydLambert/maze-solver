/*
	Grid is the main class in this program. It contains a multidimensional array of Cell objects and
	the necessary methods for generating and solving mazes with these Cells.
*/
class Grid{
	/*
		The constructor creates a multidimensional array in the 'cells' property with the specified
		width and height. It fills the array with new Cell objects to form the maze grid.
	*/
	constructor(width=4, height=3){
		this.width=width;
		this.height=height;

		this.cells=[];
		for(let x=0;x<this.width;x++){
			this.cells.push([]);
			for(let y=0;y<this.height;y++){
				this.cells[x].push(new Cell(this,x,y));
			}
		}
	}

	async generateMaze(ctx,delay=1){
		if(ctx && delay>0) stop=false;

		let stack=[this.cells[0][0]];
		while(stack.length){
			let top=stack[stack.length-1];
			top.visited=true;
			if(ctx && delay>0){
				top.mapped=true;
				render(this, ctx);
				top.mapped=false;
				await new Promise(resolve=>setTimeout(()=>resolve(),delay));
				if(stop){
					stop=false;
					return;
				}
			}
			let adjacent=top.getAdjacent().filter(e=>!e.visited);
			if(adjacent.length){
				let link=adjacent[Math.floor(Math.random()*adjacent.length)];
				top.links.push(link);
				stack.push(link);
			}
			else{
				stack.pop();
			}
		}
	}

	async solveMaze(ctx,{
		delay=1,
		greedy=false,
		heuristic=true,
	}={}){
		if(ctx && delay>0) stop=false;

		let nodes=[this.cells[0][0]];
		let end=this.cells[this.width-1][this.height-1];
		nodes[0].globalGoal=this.width+this.height-2;
		nodes[0].localGoal=0;
		while((greedy && nodes.length) || (nodes.length && !end.mapped)){
			let current=nodes[0];
			if(!current.mapped){
				current.links.forEach(child=>{
					nodes.push(child);
					if(current.localGoal+1 < child.localGoal){
						child.parent=current;
						child.localGoal=current.localGoal+1;
					}
					child.globalGoal=child.localGoal+(heuristic ? child.distanceTo(end) : 1);
				});
				current.mapped=true;
			}
			nodes.splice(0,1);
			nodes.sort((a,b)=>a.globalGoal-b.globalGoal);
			if(ctx && delay>0){
				render(this, ctx);
				await new Promise(resolve=>setTimeout(()=>resolve(),delay));
				if(stop){
					stop=false;
					return;
				}
			}
		}
	}
}
