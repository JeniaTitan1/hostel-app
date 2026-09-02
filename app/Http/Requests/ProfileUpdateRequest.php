<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ],
            'telegram' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'gender' => ['sometimes', 'nullable', 'string', Rule::in(['male', 'female'])],
            'specialty' => ['sometimes', 'nullable', 'string', 'max:10'],
            'course' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:6'],
            'group' => ['sometimes', 'nullable', 'string', 'max:15'],
        ];

        if ($user->must_change_password) {
            if (!$user->password_changed || $this->filled('password')) {
                $rules['password'] = ['required', 'string', Password::defaults(), 'confirmed'];
            }
        } else {
            if ($this->filled('password')) {
                $rules['current_password'] = ['required', 'current_password'];
                $rules['password'] = ['required', 'string', Password::defaults(), 'confirmed'];
            }
        }

        return $rules;
    }
}
