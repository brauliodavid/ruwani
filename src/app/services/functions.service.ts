import { Injectable } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup } from "@angular/forms";
import { isObject } from 'lodash'
import * as _moment from 'moment-timezone'
const moment = _moment

@Injectable({
    providedIn: 'root',
})
export class FunctionsService {

    setForm(formGroup: AbstractControl, obj: any, opts: any = { disabled: false, emitEvent: true, ignoreProps: [], stopPropagation: false, setValue: null}){
		const { disabled = false, emitEvent = true, ignoreProps = [], stopPropagation = false, setValue = null} = opts

        if(!obj) return;

        if(stopPropagation) return;

        let keys = []
        if(formGroup instanceof FormGroup){
            keys = Object.keys(obj)
        }else if(formGroup instanceof FormArray){
            keys = obj
            // let diff1 = differenceBy(formGroup.getRawValue(), obj, '_id')
            // if(diff1.length){
            //     this.removeFromFormArray(formGroup, diff1, '_id')
            // }
            // let diff2 = differenceBy(formGroup.getRawValue(), obj, 'id')
            // if(diff2.length){
            //     this.removeFromFormArray(formGroup, diff2, 'id')
            // }
        }

		keys.map((key, i) => {
            if(formGroup instanceof FormArray){
                key = i
            }
            let value = obj[key]

            const setControl = () => {
                if(stopPropagation) return;
                
                let control: FormControl = formGroup['controls'][key];
                if(this.isValidTimeStamp(value) || moment.isMoment(value)){
                    value = value.toDate()
                }
				if(control && control.value !== value){
                    setValue ? setValue(control, value) : control.patchValue(value, { emitEvent })
				}else if(!control){
                    control = new FormControl({value, disabled})
					if(formGroup instanceof FormGroup){
						formGroup.addControl(key, control);
					}else if(formGroup instanceof FormArray){
						(<FormArray>formGroup).push(control);
					}
                }
                if(control){
                    if(disabled === true && !control.disabled){
                        control.disable({emitEvent: false})
                    }else if(disabled === false && control.disabled){
                        control.enable({emitEvent: false})
                    }
                }
            }

			if((!isObject(value) && !Array.isArray(value)) || this.isValidTimeStamp(value) || moment.isMoment(value) || value instanceof Date){
                setControl()
			}else if(isObject(value) && !Array.isArray(value) && !(value instanceof Date) && !this.isValidTimeStamp(value)){
				if(ignoreProps.includes(key)){
                    setControl()
                    return;
                }
                let group = formGroup['controls'][key];
				if(group){
					this.setForm(group, value, opts)
				}else if(!group){
					group = new FormGroup({});
					this.setForm(group, value, opts);
					if(formGroup instanceof FormGroup){
						formGroup.addControl(key, group);
					}else if(formGroup instanceof FormArray){
						(<FormArray>formGroup).push(group);
					}
				}
			}else if(Array.isArray(value)){
                if(ignoreProps.includes(key)){
                    setControl()
                    return;
                }
                
                let array = formGroup['controls'][key];
                if(array){
                    this.setForm(array, value, opts);
                }else{
                    array = new FormArray([]);
                    this.setForm(array, value, opts);
                    if(formGroup instanceof FormGroup){
                        formGroup.addControl(key, array);
                    }else if(formGroup instanceof FormArray){
                        (<FormArray>formGroup).push(array);
                    }
                }
			}
        })

        // delete from form array
        if(formGroup instanceof FormArray){
            const size1 = formGroup.length // Eg. 7
            const size2 = obj.length // Eg. 5
            if((size1 - size2) > 0){
                for (let i = size2; i < size1; i++) {
                    formGroup.removeAt(i)
                }
            }
        }
    }

    dateFormat(date, format, tz?){
        if(!date) return '';
        
        let date2 = date
        if(date instanceof Date){
            date2 = date
        }
        else if(this.isValidTimeStamp(date)){
            // date2 = date.toDate()
            date2 = moment.unix(date['seconds']).toDate()
        }else if(this.isValidTimeStamp2(date)){
            date2 = moment.unix(date['_seconds']).toDate()
        }
        if(tz){
            return moment(date2).tz(tz).format(format); 
        }
        return moment(date2).format(format); 
    }

    isValidTimeStamp(value){
        if(isObject(value) && value.hasOwnProperty('seconds') && value.hasOwnProperty('nanoseconds')) 
        return true
        return false
    }

    isValidTimeStamp2(value){
        if(isObject(value) && value.hasOwnProperty('_seconds') && value.hasOwnProperty('_nanoseconds')) 
        return true
        return false
    }
}