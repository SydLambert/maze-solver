class Grid{
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

	render(ctx,{
		color="#FFFFFF",
		backgroundColor="#000000",
		startColor="#FF7777",
		endColor="#AAFF66",
		mappedColor="#FFD700",
		pathColor="#FF00FF",
		curvy=false
	}={}){
		ctx.fillStyle=backgroundColor;
		ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

		let cellWidth=ctx.canvas.width/this.width;
		let cellHeight=ctx.canvas.height/this.height;

		this.cells.flat().forEach(cell=>{
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

		this.cells.flat().filter(e=>
			((!curvy&&e.visited)||e.color) || (curvy&&e.color)
		).forEach(cell=>{
			ctx.fillStyle=cell.color || (cell.mapped ? mappedColor : color);
			if(!cell.distanceTo(0,0)) ctx.fillStyle=startColor;
			if(!cell.distanceTo(this.width-1, this.height-1)) ctx.fillStyle=endColor;
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
			Math.ceil(((this.width-1)*cellWidth)+cellWidth/2),
			Math.ceil(((this.height-1)*cellHeight)+cellHeight/2)
		);

		this.cells[this.width-1][this.height-1].lineParents(ctx, cellWidth, cellHeight);
		ctx.stroke();
	}

	async generateMaze(ctx,delay=1){
		if(ctx && delay>0) stop=false;

		let stack=[this.cells[0][0]];
		while(stack.length){
			let top=stack[stack.length-1];
			top.visited=true;
			if(ctx && delay>0){
				top.mapped=true;
				this.render(ctx);
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
				this.render(ctx);
				await new Promise(resolve=>setTimeout(()=>resolve(),delay));
				if(stop){
					stop=false;
					return;
				}
			}
		}
	}
}
