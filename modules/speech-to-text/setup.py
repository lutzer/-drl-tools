from setuptools import setup, find_packages
import os

with open('requirements.txt') as f:
    required = f.read().splitlines()

setup(
    name='stt_tools',
    entry_points = {
        'console_scripts' : [
            'stt_record=stt_tools.record:main',
            'stt_transcribe=stt_tools.transcribe:main'
        ]
    },
    version='0.1.0',
    install_requires=required,
    packages=find_packages("."),
    python_requires='>=3.6'
)