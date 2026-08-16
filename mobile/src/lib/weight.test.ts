import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  bmi,
  bmiCategory,
  expectedRangeAtWeek,
  positionIn,
  totalRange,
  weightPicture,
} from './weight';

describe('BMI', () => {
  it('computes from kilograms and centimetres', () => {
    assert.equal(Math.round(bmi(60, 165)! * 10) / 10, 22);
  });

  it('refuses impossible inputs rather than returning Infinity', () => {
    assert.equal(bmi(60, 0), null);
    assert.equal(bmi(0, 165), null);
    assert.equal(bmi(-5, 165), null);
  });

  it('splits at the published boundaries', () => {
    assert.equal(bmiCategory(18.4), 'underweight');
    assert.equal(bmiCategory(18.5), 'normal');
    assert.equal(bmiCategory(24.9), 'normal');
    assert.equal(bmiCategory(25), 'overweight');
    assert.equal(bmiCategory(29.9), 'overweight');
    assert.equal(bmiCategory(30), 'obese');
  });
});

describe('the published gain band', () => {
  it('matches the IOM totals for each category', () => {
    assert.deepEqual(totalRange('normal'), { min: 11.5, max: 16 });
    assert.deepEqual(totalRange('obese'), { min: 5, max: 9 });
  });

  it('starts at nothing rather than showing a target from week four', () => {
    assert.deepEqual(expectedRangeAtWeek('normal', 4), { min: 0, max: 0 });
  });

  it('reaches the full first-trimester allowance by week 14', () => {
    assert.deepEqual(expectedRangeAtWeek('normal', 14), { min: 0.5, max: 2 });
  });

  it('adds the weekly rate through the second and third trimesters', () => {
    // Week 20 is six weeks of the normal-BMI rate on top of the allowance.
    assert.deepEqual(expectedRangeAtWeek('normal', 20), { min: 2.6, max: 5 });
  });

  it('never lets the band exceed the published total', () => {
    const late = expectedRangeAtWeek('normal', 42);
    const total = totalRange('normal');
    assert.ok(late.min <= total.min);
    assert.ok(late.max <= total.max);
  });

  it('places a gain below, within or above the band', () => {
    const range = { min: 2.6, max: 5 };
    assert.equal(positionIn(1.2, range), 'below');
    assert.equal(positionIn(3, range), 'within');
    assert.equal(positionIn(5, range), 'within');
    assert.equal(positionIn(6.4, range), 'above');
  });
});

describe('the whole picture', () => {
  it('needs height and pre-pregnancy weight before it will draw a band', () => {
    assert.equal(weightPicture(66, 60, null, 20), null);
    assert.equal(weightPicture(66, null, 165, 20), null);
    assert.equal(weightPicture(null, 60, 165, 20), null);
  });

  it('reports the gain against the band for this week', () => {
    const picture = weightPicture(64, 60, 165, 20)!;
    assert.equal(picture.category, 'normal');
    assert.equal(picture.gainKg, 4);
    assert.equal(picture.position, 'within');
    assert.deepEqual(picture.range, { min: 2.6, max: 5 });
  });

  it('does not hide a gain that sits outside the band', () => {
    assert.equal(weightPicture(70, 60, 165, 20)!.position, 'above');
    assert.equal(weightPicture(61, 60, 165, 20)!.position, 'below');
  });
});
