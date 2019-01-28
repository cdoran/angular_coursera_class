import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comment } from '../shared/comment';
import { visibility, expand } from '../animations/app.animation';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [visibility(), expand()]
})
export class DishdetailComponent implements OnInit {

  @Input()
  dish: Dish;
  dishcopy: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;

  visibility: string = 'shown';
  
  @ViewChild('cform') commentFormDirective;
  commentForm: FormGroup;
  comment: Comment;
  
  formErrors = { 
      'author': '',
      'comment': '',
      'rating': '',
  };
  
  validationMessages = {
      'author': {
        'required': 'Name is required.',
        'minlength': 'Name must be at least 2 characters long.',
      },
      'comment': {
        'required': 'A comment is required.',
      },
      'rating': {
        'required': 'Rating is required',
        'pattern': 'Rating must be a number'
      },
  };

  constructor(private dishservice: DishService,
              private route: ActivatedRoute,
              private location: Location,
              private fb: FormBuilder,
              @Inject('BaseURL') private BaseURL) { 
    this.createForm() 
  }

  ngOnInit() {
    this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds,
      errmess => this.errMess = <any>errmess);
    this.route.params.pipe(switchMap((params: Params) => {
        this.visibility = 'hidden';
        return this.dishservice.getDish(params['id']); }))
        .subscribe((dish: Dish) => { 
             this.dish = dish; 
             this.dishcopy = dish;
             this.setPrevNext(dish.id); 
             this.visibility = 'shown';
             }, errmess => this.errMess = <any>errmess
        );
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }

  createForm() {
    this.commentForm = this.fb.group({
      rating: 5,
      comment: ['', [Validators.required]],
      author: ['', [Validators.required, Validators.minLength(2)]],
      date: ''
    })
    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));
    this.onValueChanged();

  }

  onSubmit() {
    this.comment = this.commentForm.value;
    let today = new Date()  
    this.comment.date = today.toISOString();
    //this.dish.comments.push(this.comment);
    console.log(this.comment);
    this.commentFormDirective.resetForm({rating: 5});
    this.dishcopy.comments.push(this.comment);
    this.dishservice.putDish(this.dishcopy)
      .subscribe(dish => { 
             this.dish = dish; 
             this.dishcopy = dish;
             }, errmess => { this.dish = null, this.dishcopy = null, this.errMess = <any>errmess; }
        );
  }
     
  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }

}
