import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';

interface Shape {
  type: string;
  comment: string;
  axis: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
}

@Component({
  selector: 'app-canvas',
  template: `
    <div>
      <svg
        #canvasRef
        [attr.width]="width"
        [attr.height]="height"
        style="background: url('https://asia.olympus-imaging.com/content/000107506.jpg'); background-size: cover;background-repeat: no-repeat;"
      ></svg>
      <div>
        <button (click)="handleShapeChange('rect')">Rectangle</button>
        <button (click)="handleShapeChange('circle')">Circle</button>
        <button (click)="handleShapeChange('arrow')">Arrow</button>
      </div>
    </div>

    <div class="popup-overlay" *ngIf="showPopup">
      <div class="popup">
        <div class="header">
          <div class="text">Add comment</div>
          <div (click)="cancelComments()" class="close">X</div>
        </div>
        <div class="body">
          <div>Comment</div>
          <textarea [(ngModel)]="comments"></textarea>
          <!-- <div *ngIf="currentShapeHasComment()" class="comment-display">
            <p>Shape Comment: {{ comments }}</p>
          </div> -->
     
            <button (click)="saveComments()" class="add">Add Comment</button>
            <button (click)="handleDelete()" class="delete">delete</button>
    
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .add {
        background-color: #ff375e;
        border-radius: 4px;
        border: none;
        color: white;
        padding: 10px;
      }
      .delete {
        margin-left: 10px;
        background-color: #ff375e;
        border-radius: 4px;
        border: none;
        color: white;
        padding: 10px;
      }
      .selected {
        stroke-width: 5px !important;
        cursor: move;
      }
      .close {
        cursor: pointer;
      }
      .header {
        display: flex;
        justify-content: space-between;
        border-bottom: solid #e7e8fc 1px;
      }
      .popup {
        background-color: white;
        padding: 20px;
        border-radius: 5px;
      }
      .text {
        padding-bottom: 12px;
      }
      .body {
        padding-top: 12px;
      }

      textarea {
        width: 100%;
        height: 100px;
        margin-bottom: 10px;
        margin-top: 2px;
      }
    `,
  ],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<SVGElement>;

  width: number = 800;
  height: number = 800;
  currentShape: string = 'circle'; // Default shape
  showPopup: boolean = false;
  comments: string = '';
  shapes: Shape[] = []; // Array to store the shape objects

  ngAfterViewInit() {
    const canvas = d3.select(this.canvasRef.nativeElement);

    let isDrawing = false;
    let startPoint = { x: 0, y: 0 };
    let selectedShapeStartPoint = { x: 0, y: 0 };
    let selectedCircleStartPoint = { cx: 0, cy: 0 };
    let shapeElement: any = null;
    let currentSelectedShape: any = null;
    let delta = { x: 0, y: 0 };
    let ciclePoints = { cx: 0, cy: 0 };

    // Event handlers for mouse interaction
    const handleMouseDown = (event: any) => {
      // const selectedShape = d3.select(event.target);
      startPoint = { x: event.offsetX, y: event.offsetY };
      if (currentSelectedShape) {
        console.log(`Current Shape of Arrow ${currentSelectedShape.attr()}`);
        selectedShapeStartPoint = {
          x: parseInt(currentSelectedShape.attr('x')),
          y: parseInt(currentSelectedShape.attr('y')),
        };
        selectedCircleStartPoint = {
          cx: parseInt(currentSelectedShape.attr('cx')),
          cy: parseInt(currentSelectedShape.attr('cy')),
        };
        switch (currentSelectedShape.node().tagName) {
          case 'rect':
            delta = {
              x: startPoint.x - selectedShapeStartPoint.x,
              y: startPoint.y - selectedShapeStartPoint.y,
            };
            break;
          case 'circle':
            ciclePoints = {
              cx: startPoint.x - selectedCircleStartPoint.cx,
              cy: startPoint.y - selectedCircleStartPoint.cy,
            };
            break;
        }
      } else {
        isDrawing = true;

        // Determine the shape based on user input (e.g., 'r' for rectangle, 'c' for circle, 'a' for arrow)
        const shape = this.currentShape;

        switch (shape) {
          case 'rect':
            shapeElement = canvas
              .append('rect')
              .attr('x', startPoint.x)
              .attr('y', startPoint.y)
              .attr('width', 0)
              .attr('height', 0)
              .attr('stroke', '#FF375E')
              .attr('stroke-width', 3)
              .attr('fill', 'none')
              .attr('class', 'selected')
              .attr('cursor', 'move')
              .on('mousedown', function () {
                onShapeSelected(this);
              });
            break;
          case 'circle':
            shapeElement = canvas
              .append('circle')
              .attr('cx', startPoint.x)
              .attr('cy', startPoint.y)
              .attr('r', 0)
              .attr('stroke', '#FF375E')
              .attr('stroke-width', 3)
              .attr('fill', 'none')
              .attr('class', 'selected')
              .attr('cursor', 'move')
              .attr('data-index', this.shapes.length) // Add data-index attribute
              .on('mousedown', function () {
                onShapeSelected(this);
              });
            break;
          case 'arrow':
            shapeElement = this.drawArrow(
              canvas.on('mousedown', function () {
                onShapeSelected(this);
              }),
              startPoint.x,
              startPoint.y,
              startPoint.x,
              startPoint.y
            );
            break;
          default:
            break;
        }
      }
    };

    const handleMouseMove = (event: any) => {
      if (!isDrawing && !currentSelectedShape) return;
      const currentX = event.offsetX;
      const currentY = event.offsetY;

      if (currentSelectedShape) {
        switch (currentSelectedShape.node().tagName) {
          case 'rect':
            currentSelectedShape
              .attr('x', currentX - delta.x)
              .attr('y', currentY - delta.y);
            break;
          case 'circle':
            currentSelectedShape
              .attr('cx', currentX - ciclePoints.cx)
              .attr('cy', currentY - ciclePoints.cy);
            break;
        }
      } else {
        if (shapeElement) {
          const dx = currentX - startPoint.x;
          const dy = currentY - startPoint.y;
          switch (shapeElement.node().tagName) {
            case 'rect':
              shapeElement.attr('width', dx).attr('height', dy);
              break;
            case 'circle':
              const radius = Math.sqrt(dx * dx + dy * dy);
              shapeElement.attr('r', radius);
              break;
            case 'g': // Arrow
              const line = shapeElement.select('line');
              const polygon = shapeElement.select('polygon');
              const arrowSize = 10; // Size of the arrowhead

              line
                .attr('x1', startPoint.x)
                .attr('y1', startPoint.y)
                .attr('x2', currentX)
                .attr('y2', currentY);
              polygon
                .attr(
                  'points',
                  `0,0 ${-arrowSize},${arrowSize / 2} ${-arrowSize},${
                    -arrowSize / 2
                  }`
                )
                .attr(
                  'transform',
                  `translate(${currentX}, ${currentY}) rotate(${
                    (Math.atan2(dy, dx) * 180) / Math.PI
                  })`
                );

              break;
            default:
              break;
          }
        }
      }
    };

    const handleMouseUp = (e: any) => {
      isDrawing = false;
      if (currentSelectedShape) {
        onShapeReleased();
      }
      const currentX = e.offsetX;
      const currentY = e.offsetY;
      // Create a new shape object and push it to the shapes array
      const shape: Shape = {
        type: this.currentShape,
        comment: '',
        axis: {
          startX: startPoint.x,
          startY: startPoint.y,
          endX: currentX,
          endY: currentY,
        },
      };

      this.shapes.push(shape);

      this.showPopup = true; // Show the popup when the user releases the mouse button
    };

    const onShapeSelected = (shape: any) => {
      currentSelectedShape = d3.select(shape);

      // Check if the selected shape already has a comment
      const selectedShape = this.shapes.find(
        (s) => s.type === this.currentShape
      );
      if (selectedShape) {
        this.comments = selectedShape.comment; // Set the comment to the input box
      } else {
        this.comments = ''; // Clear the input box
      }

      // Check if the selected shape is a circle
      if (currentSelectedShape.node().tagName === 'circle') {
        const index = currentSelectedShape.attr('data-index');
        if (index) {
          const shapeWithComment = this.shapes[parseInt(index)];
          if (shapeWithComment && shapeWithComment.comment !== '') {
            this.comments = shapeWithComment.comment;
          }
        }
      }

      console.log('Shape is moving');
    };

    const onShapeReleased = () => {
      const shape = this.currentShape;
      console.log(shape);
      // switch (shape) {}
      currentSelectedShape.classed('selected', true).attr('stroke-width', 2);
      selectedShapeStartPoint = { x: 0, y: 0 };
      delta = { x: 0, y: 0 };
      console.log(selectedShapeStartPoint);
      currentSelectedShape = null;
    };

    // Attach event listeners
    canvas
      .on('mousedown', handleMouseDown)
      .on('mousemove', handleMouseMove)
      .on('mouseup', handleMouseUp);
  }

  handleShapeChange(shape: string) {
    this.currentShape = shape;

    // Check if the selected shape already has a comment
    const selectedShape = this.shapes.find(
      (shape) => shape.type === this.currentShape
    );
    if (selectedShape) {
      this.comments = selectedShape.comment; // Set the comment to the input box
    } else {
      this.comments = ''; // Clear the input box
    }
  }

  // Function to calculate the arrowhead
  drawArrow(
    svg: any,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) {
    const dx = endX - startX;
    const dy = endY - startY;
    const arrowSize = 10; // Size of the arrowhead

    const arrow = svg.append('g').attr('class', 'arrow');

    arrow
      .append('line')
      .attr('x1', startX)
      .attr('y1', startY)
      .attr('x2', endX)
      .attr('y2', endY)
      .attr('stroke', '#FF375E')
      .attr('stroke-width', 3);

    arrow
      .append('polygon')
      .attr(
        'points',
        `0,0 ${-arrowSize},${arrowSize / 2} ${-arrowSize},${-arrowSize / 2}`
      )
      .attr('fill', '#FF375E')
      .attr(
        'transform',
        `translate(${endX}, ${endY}) rotate(${
          (Math.atan2(dy, dx) * 180) / Math.PI
        })`
      );

    return arrow;
  }
  currentShapeHasComment(): boolean {
    const selectedShape = this.shapes.find(
      (shape) => shape.type === this.currentShape
    );
    return !!selectedShape && selectedShape.comment !== '';
  }

  getShapeComment(): string {
    const selectedShape = this.shapes.find(
      (shape) => shape.type === this.currentShape
    );
    return selectedShape ? selectedShape.comment : '';
  }

  saveComments() {
    // Handle saving the comments, e.g., store in a variable, send to server, etc.
    const lastIndex = this.shapes.length - 1;
    this.shapes[lastIndex].comment = this.comments;

    console.log('Shape:', this.shapes[lastIndex]);
    this.comments = ''; // Clear the comments
    this.showPopup = false; // Hide the popup
    this.saveImage();
  }
  saveImage() {
    const canvas = this.canvasRef.nativeElement;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(canvas);
  
    // Create a new SVG element with the comments
    const svgWithComments = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    const commentElements = this.shapes.map((shape) => {
      const commentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      commentText.textContent = shape.comment;
      commentText.setAttribute('x', shape.axis.startX.toString());
      commentText.setAttribute('y', shape.axis.startY.toString());
      commentText.setAttribute('fill', 'white');
      commentText.setAttribute('font-size', '14px');
      return commentText;
    });
  
    // Append the comment elements to the SVG
    commentElements.forEach((comment) => {
      svgWithComments.documentElement.appendChild(comment);
    });
  
    const base64 = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svgWithComments));
    console.log('Base64 Image:', base64);
  }
  
  
  
  cancelComments() {
    this.comments = ''; // Clear the comments
    this.showPopup = false; // Hide the popup
  }
  handleDelete() {
    if (this.shapes.length > 0) {
      // Check if the first shape is a circle
      if (this.shapes[0].type === 'circle') {
        const canvas = d3.select(this.canvasRef.nativeElement);
        const firstCircle = canvas.select('circle');

        if (!firstCircle.empty()) {
          firstCircle.remove(); // Remove the first circle element from the canvas
          this.shapes.splice(0, 1); // Remove the first circle from the shapes array
        }
      }
    }
    this.showPopup = false;
  }
}
