<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'telegram' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'gender' => ['sometimes', 'nullable', 'string', Rule::in(['male', 'female'])],
            'specialty' => ['sometimes', 'nullable', 'string', 'max:10'],
            'course' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:6'],
            'group' => ['sometimes', 'nullable', 'string', 'max:15'],
        ];
    }
}
